import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, map, shareReplay, tap, throwError } from 'rxjs';
import { AUTH_HABILITADA } from '../auth/auth-config';
import { LoginRequest, RegistroRequest, Sessao, TokenResponse } from '../models/auth.model';
import { Usuario } from '../models/usuario.model';

const CHAVE_SESSAO = 'fincontrol.sessao';

// Claims do access token do Keycloak que o front usa
interface ClaimsKeycloak {
  sub: string;
  email?: string;
  name?: string;
  given_name?: string;
  realm_access?: { roles: string[] };
}

// Login pelo back (que repassa ao Keycloak). O front so guarda e envia o token; quem valida e o back.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl: string = 'http://localhost:8080/auth';
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly sessao = signal<Sessao | null>(this.lerSessaoSalva());
  // uma renovacao por vez: requisicoes simultaneas esperam a mesma
  private renovacaoEmAndamento: Observable<string> | null = null;

  private readonly claims = computed(() => {
    const sessao = this.sessao();
    return sessao ? lerClaims(sessao.accessToken) : null;
  });

  readonly logado = computed(() => this.sessao() !== null);
  readonly roles = computed(() => this.claims()?.realm_access?.roles ?? []);
  // com o login desligado (AUTH_HABILITADA = false) todas as areas ficam visiveis
  readonly isAdmin = computed(() => !AUTH_HABILITADA || this.roles().includes('ADMIN'));
  // area operacional (transacoes, categorias, contatos) e da role USER; o admin puro nao a ve
  readonly temRoleUser = computed(() => !AUTH_HABILITADA || this.roles().includes('USER'));
  readonly nome = computed(() => this.claims()?.given_name ?? this.claims()?.name ?? this.claims()?.email ?? '');

  login(dados: LoginRequest): Observable<void> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, dados).pipe(
      tap((token) => this.salvarSessao(token)),
      map(() => undefined),
    );
  }

  registrar(dados: RegistroRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/registro`, dados);
  }

  usuarioLogado(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/me`);
  }

  // encerra a sessao no Keycloak (melhor esforco) e volta para o login
  logout(): void {
    const sessao = this.sessao();
    this.limparSessao();

    if (sessao) {
      this.http.post<void>(`${this.apiUrl}/logout`, { refreshToken: sessao.refreshToken }).subscribe({
        error: () => undefined,
      });
    }

    this.router.navigate(['/login']);
  }

  // access token para o header Authorization (null = sem login)
  accessToken(): string | null {
    return this.sessao()?.accessToken ?? null;
  }

  // vence nos proximos 30s: melhor renovar antes de mandar a requisicao
  accessTokenPertoDeVencer(): boolean {
    const sessao = this.sessao();
    return !!sessao && sessao.accessExpiraEm - Date.now() < 30_000;
  }

  // troca o refresh token por um novo access token; erro = sessao acabou
  renovar(): Observable<string> {
    const sessao = this.sessao();
    if (!sessao) {
      return throwError(() => new Error('Sem sessão para renovar.'));
    }

    if (!this.renovacaoEmAndamento) {
      this.renovacaoEmAndamento = this.http
        .post<TokenResponse>(`${this.apiUrl}/refresh`, { refreshToken: sessao.refreshToken })
        .pipe(
          tap((token) => this.salvarSessao(token)),
          map((token) => token.accessToken),
          finalize(() => (this.renovacaoEmAndamento = null)),
          shareReplay(1),
        );
    }

    return this.renovacaoEmAndamento;
  }

  // sessao expirada ou recusada pelo back: limpa e manda para o login, voltando depois para a mesma tela
  encerrarSessaoExpirada(): void {
    this.limparSessao();
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url, expirada: true } });
  }

  private salvarSessao(token: TokenResponse): void {
    const agora = Date.now();
    const sessao: Sessao = {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      accessExpiraEm: agora + token.expiresIn * 1000,
      refreshExpiraEm: agora + token.refreshExpiresIn * 1000,
    };

    this.sessao.set(sessao);
    try {
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    } catch {
      // navegador sem localStorage (ex.: modo privado restrito): a sessao vale so ate recarregar
    }
  }

  private limparSessao(): void {
    this.sessao.set(null);
    try {
      localStorage.removeItem(CHAVE_SESSAO);
    } catch {
      // nada a limpar
    }
  }

  // sessao salva so vale se o refresh token ainda nao venceu
  private lerSessaoSalva(): Sessao | null {
    try {
      const texto = localStorage.getItem(CHAVE_SESSAO);
      if (!texto) return null;

      const sessao = JSON.parse(texto) as Sessao;
      return sessao.refreshExpiraEm > Date.now() ? sessao : null;
    } catch {
      return null;
    }
  }
}

// Le o payload do JWT (sem validar a assinatura: isso e trabalho do back).
// O payload e base64url com UTF-8, por isso o TextDecoder (nomes com acento, ex.: "João").
function lerClaims(token: string): ClaimsKeycloak | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as ClaimsKeycloak;
  } catch {
    return null;
  }
}

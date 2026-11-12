import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import Keycloak from 'keycloak-js';
import { Observable, finalize, from, map, shareReplay, throwError } from 'rxjs';
import { AUTH_HABILITADA, KEYCLOAK_CONFIG } from '../auth/auth-config';
import { CadastroCompletoRequest, CadastroSimplesRequest } from '../models/cadastro.model';
import { Usuario } from '../models/usuario.model';

// sessao do login antigo (tokens no localStorage); so e apagada, para nao ficar esquecida no navegador
const CHAVE_SESSAO_ANTIGA = 'fincontrol.sessao';

// Claims do access token do Keycloak que o front usa
interface ClaimsKeycloak {
  sub: string;
  email?: string;
  name?: string;
  given_name?: string;
  realm_access?: { roles: string[] };
}

// cliente do keycloak-js; nos testes e trocado por um falso
export const KEYCLOAK = new InjectionToken<Keycloak>('KEYCLOAK', {
  providedIn: 'root',
  factory: () => new Keycloak(KEYCLOAK_CONFIG),
});

// Login pelo Keycloak (Authorization Code com PKCE): o front so redireciona para a tela de login do
// Keycloak e recebe os tokens; a senha nunca passa pelo app. Quem valida o token e o back.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl: string = 'http://localhost:8080/auth';
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly keycloak = inject(KEYCLOAK);

  // access token atual (null = sem login). Fica so em memoria: ao recarregar, o iniciar() o recupera
  private readonly token = signal<string | null>(null);
  // uma renovacao por vez: requisicoes simultaneas esperam a mesma
  private renovacaoEmAndamento: Observable<string> | null = null;

  private readonly claims = computed(() => {
    const token = this.token();
    return token ? lerClaims(token) : null;
  });

  readonly logado = computed(() => this.token() !== null);
  readonly roles = computed(() => this.claims()?.realm_access?.roles ?? []);
  // com o login desligado (AUTH_HABILITADA = false) todas as areas ficam visiveis
  readonly isAdmin = computed(() => !AUTH_HABILITADA || this.roles().includes('ADMIN'));
  // area operacional (transacoes, categorias, contatos) e da role USER; o admin puro nao a ve
  readonly temRoleUser = computed(() => !AUTH_HABILITADA || this.roles().includes('USER'));
  // tela inicial de cada papel: admin puro vai para o painel da area administrativa
  rotaInicial(): string {
    return this.isAdmin() && !this.temRoleUser() ? '/painel' : '/transacoes';
  }

  readonly nome = computed(() => this.claims()?.given_name ?? this.claims()?.name ?? this.claims()?.email ?? '');

  // Na abertura do app (provideAppInitializer): recupera a sessao do Keycloak sem pedir senha, ou
  // conclui o login quando o Keycloak acabou de devolver o usuario ao app.
  async iniciar(): Promise<void> {
    if (!AUTH_HABILITADA) return;

    try {
      localStorage.removeItem(CHAVE_SESSAO_ANTIGA);
    } catch {
      // navegador sem localStorage: nada a limpar
    }

    this.keycloak.onAuthLogout = () => this.token.set(null);
    try {
      await this.keycloak.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: `${location.origin}/silent-check-sso.html`,
        // o iframe de monitoramento depende de cookies de terceiros; a renovacao ja detecta sessao encerrada
        checkLoginIframe: false,
        messageReceiveTimeout: 5000,
      });
      this.token.set(this.keycloak.token ?? null);
    } catch {
      // Keycloak fora do ar: o app abre sem sessao e o login tenta de novo ao ser pedido
      this.token.set(null);
    }
  }

  // leva para a tela de login do Keycloak; depois do login ele volta para returnUrl.
  // email (opcional) ja vem preenchido, ex.: logo depois do cadastro
  entrar(returnUrl = '/', email?: string): Promise<void> {
    return this.keycloak.login({ redirectUri: location.origin + returnUrl, loginHint: email });
  }

  // cadastro publico (papel USER) nas duas formas: simples (so o acesso) ou completo
  registrarSimples(dados: CadastroSimplesRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/registro/simples`, dados);
  }

  registrarCompleto(dados: CadastroCompletoRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/registro/completo`, dados);
  }

  usuarioLogado(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/me`);
  }

  // encerra a sessao no Keycloak, que devolve o usuario ao inicio do app (e de la ao login)
  logout(): void {
    this.token.set(null);
    void this.keycloak.logout({ redirectUri: `${location.origin}/` });
  }

  // access token para o header Authorization (null = sem login)
  accessToken(): string | null {
    return this.token();
  }

  // vence nos proximos 30s: melhor renovar antes de mandar a requisicao
  accessTokenPertoDeVencer(): boolean {
    return this.logado() && this.keycloak.isTokenExpired(30);
  }

  // pede um access token novo ao Keycloak (com o refresh token que o keycloak-js guarda em memoria);
  // erro = sessao acabou (expirou, foi encerrada pelo admin ou a conta foi desativada)
  renovar(): Observable<string> {
    if (!this.logado()) {
      return throwError(() => new Error('Sem sessão para renovar.'));
    }

    if (!this.renovacaoEmAndamento) {
      this.renovacaoEmAndamento = from(this.keycloak.updateToken(-1)).pipe(
        map(() => {
          const token = this.keycloak.token;
          if (!token) throw new Error('O Keycloak não devolveu um token.');
          this.token.set(token);
          return token;
        }),
        finalize(() => (this.renovacaoEmAndamento = null)),
        shareReplay(1),
      );
    }

    return this.renovacaoEmAndamento;
  }

  // sessao expirada ou recusada pelo back: limpa e manda para o login, voltando depois para a mesma tela
  encerrarSessaoExpirada(): void {
    this.token.set(null);
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url, expirada: true } });
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

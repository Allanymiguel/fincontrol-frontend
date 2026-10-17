import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { filter, map, tap } from 'rxjs';
import { AUTH_HABILITADA } from './auth/auth-config';
import { Logo } from './components/logo/logo';
import { AuthService } from './services/auth.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, Logo],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('fincontrol');
  protected readonly auth = inject(AuthService);
  protected readonly authHabilitada = AUTH_HABILITADA;
  private readonly router = inject(Router);

  protected readonly menuAberto = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      // ao navegar, o menu de telas estreitas fecha
      tap(() => this.menuAberto.set(false)),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  // login e cadastro tem tela propria, sem o menu
  protected readonly mostrarMenu = computed(() => !/^\/(login|registro)(\?|$)/.test(this.url()));

  // ate duas iniciais do nome, para o avatar do rodape da barra lateral
  protected readonly iniciais = computed(() => {
    const partes = (this.auth.nome() ?? '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (partes[0][0] + ultima).toUpperCase();
  });

  protected alternarMenu(): void {
    this.menuAberto.update((aberto) => !aberto);
  }

  protected sair(): void {
    this.auth.logout();
  }
}

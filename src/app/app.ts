import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { filter, map } from 'rxjs';
import { AUTH_HABILITADA } from './auth/auth-config';
import { AuthService } from './services/auth.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('fincontrol');
  protected readonly auth = inject(AuthService);
  protected readonly authHabilitada = AUTH_HABILITADA;
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  // login e cadastro tem tela propria, sem o menu
  protected readonly mostrarMenu = computed(() => !/^\/(login|registro)(\?|$)/.test(this.url()));

  protected sair(): void {
    this.auth.logout();
  }
}

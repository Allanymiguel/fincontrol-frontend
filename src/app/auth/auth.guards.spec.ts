import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RouterStateSnapshot,
  UrlTree,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { AuthService, KEYCLOAK } from '../services/auth.service';
import { KeycloakFalso, TOKEN_ADMIN, TOKEN_USER, comoKeycloak, criarKeycloakFalso } from '../testing/keycloak-falso';
import { adminGuard, authGuard, loginGuard } from './auth.guards';

describe('guards de autenticacao', () => {
  let keycloak: KeycloakFalso;

  async function preparar(token?: string): Promise<void> {
    keycloak = criarKeycloakFalso(token);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), { provide: KEYCLOAK, useValue: comoKeycloak(keycloak) }],
    });
    await TestBed.inject(AuthService).iniciar();
  }

  function rodar(guard: CanActivateFn, params: Record<string, string> = {}, url = '/'): ReturnType<CanActivateFn> {
    const route = { queryParamMap: convertToParamMap(params) } as ActivatedRouteSnapshot;
    const state = { url } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => guard(route, state));
  }

  function destino(resultado: ReturnType<CanActivateFn>): string {
    return (resultado as UrlTree).toString();
  }

  describe('loginGuard (/login leva ao Keycloak)', () => {
    it('sem login: chama o Keycloak voltando para a tela pedida e nao abre tela nenhuma', async () => {
      await preparar(undefined);

      const resultado = rodar(loginGuard, { returnUrl: '/auditoria' });

      expect(resultado).toBe(false);
      expect(keycloak.login).toHaveBeenCalledWith({ redirectUri: `${location.origin}/auditoria`, loginHint: undefined });
    });

    it('depois do cadastro o e-mail ja vai preenchido', async () => {
      await preparar(undefined);

      rodar(loginGuard, { cadastrado: 'nova@email.com' });

      expect(keycloak.login).toHaveBeenCalledWith({ redirectUri: `${location.origin}/`, loginHint: 'nova@email.com' });
    });

    it('returnUrl externo ou de volta ao /login vira o inicio do app', async () => {
      await preparar(undefined);

      rodar(loginGuard, { returnUrl: 'https://site-falso.com' });
      rodar(loginGuard, { returnUrl: '/login?returnUrl=/painel' });

      expect(keycloak.login).toHaveBeenNthCalledWith(1, { redirectUri: `${location.origin}/`, loginHint: undefined });
      expect(keycloak.login).toHaveBeenNthCalledWith(2, { redirectUri: `${location.origin}/`, loginHint: undefined });
    });

    it('quem ja esta logado vai direto para o sistema', async () => {
      await preparar(TOKEN_ADMIN);

      expect(destino(rodar(loginGuard))).toBe('/');
      expect(keycloak.login).not.toHaveBeenCalled();
    });
  });

  describe('authGuard', () => {
    it('sem login manda para /login lembrando a tela', async () => {
      await preparar(undefined);

      expect(destino(rodar(authGuard, {}, '/pagamentos'))).toBe('/login?returnUrl=%2Fpagamentos');
    });

    it('logado entra', async () => {
      await preparar(TOKEN_ADMIN);

      expect(rodar(authGuard)).toBe(true);
    });
  });

  describe('adminGuard', () => {
    it('admin entra na area administrativa', async () => {
      await preparar(TOKEN_ADMIN);

      expect(rodar(adminGuard, {}, '/painel')).toBe(true);
    });

    it('usuario sem ADMIN volta para a area dele', async () => {
      await preparar(TOKEN_USER);

      expect(destino(rodar(adminGuard, {}, '/painel'))).toBe('/transacoes');
    });
  });
});

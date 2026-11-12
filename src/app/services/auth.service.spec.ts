import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import {
  KeycloakFalso,
  TOKEN_ADMIN,
  TOKEN_USER,
  comoKeycloak,
  criarJwt,
  criarKeycloakFalso,
} from '../testing/keycloak-falso';
import { AuthService, KEYCLOAK } from './auth.service';

describe('AuthService (login pelo Keycloak)', () => {
  let keycloak: KeycloakFalso;

  function criarServico(token?: string): AuthService {
    keycloak = criarKeycloakFalso(token);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), { provide: KEYCLOAK, useValue: comoKeycloak(keycloak) }],
    });
    return TestBed.inject(AuthService);
  }

  it('abre o app com check-sso e PKCE S256, sem pedir senha', async () => {
    const auth = criarServico(TOKEN_ADMIN);

    await auth.iniciar();

    expect(keycloak.init).toHaveBeenCalledWith(
      expect.objectContaining({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: `${location.origin}/silent-check-sso.html`,
      }),
    );
    expect(auth.logado()).toBe(true);
    expect(auth.accessToken()).toBe(TOKEN_ADMIN);
  });

  it('admin puro cai no painel e usuario em transacoes', async () => {
    const admin = criarServico(TOKEN_ADMIN);
    await admin.iniciar();
    expect(admin.isAdmin()).toBe(true);
    expect(admin.temRoleUser()).toBe(false);
    expect(admin.rotaInicial()).toBe('/painel');

    TestBed.resetTestingModule();
    const usuario = criarServico(TOKEN_USER);
    await usuario.iniciar();
    expect(usuario.isAdmin()).toBe(false);
    expect(usuario.rotaInicial()).toBe('/transacoes');
  });

  it('le o nome com acento do token', async () => {
    const auth = criarServico(TOKEN_USER);
    await auth.iniciar();

    expect(auth.nome()).toBe('João');
  });

  it('sem sessao no Keycloak o app abre deslogado', async () => {
    const auth = criarServico(undefined);
    await auth.iniciar();

    expect(auth.logado()).toBe(false);
    expect(auth.accessToken()).toBeNull();
  });

  it('com o Keycloak fora do ar o app abre deslogado, sem erro', async () => {
    const auth = criarServico(TOKEN_ADMIN);
    keycloak.init.mockRejectedValueOnce(new Error('timeout'));

    await expect(auth.iniciar()).resolves.toBeUndefined();
    expect(auth.logado()).toBe(false);
  });

  it('apaga a sessao do login antigo guardada no navegador', async () => {
    localStorage.setItem('fincontrol.sessao', '{"accessToken":"antigo"}');
    const auth = criarServico(TOKEN_ADMIN);

    await auth.iniciar();

    expect(localStorage.getItem('fincontrol.sessao')).toBeNull();
  });

  it('entrar leva ao login do Keycloak voltando para a tela pedida', async () => {
    const auth = criarServico(undefined);

    await auth.entrar('/pagamentos', 'admin@fincontrol.com');

    expect(keycloak.login).toHaveBeenCalledWith({
      redirectUri: `${location.origin}/pagamentos`,
      loginHint: 'admin@fincontrol.com',
    });
  });

  it('renovar pede um token novo ao Keycloak e passa a usa-lo', async () => {
    const auth = criarServico(TOKEN_ADMIN);
    await auth.iniciar();
    const novo = criarJwt({ sub: 'admin-id', realm_access: { roles: ['ADMIN'] } });
    keycloak.updateToken.mockImplementationOnce(async () => {
      keycloak.token = novo;
      return true;
    });

    const token = await firstValueFrom(auth.renovar());

    expect(keycloak.updateToken).toHaveBeenCalledWith(-1);
    expect(token).toBe(novo);
    expect(auth.accessToken()).toBe(novo);
  });

  it('renovacoes simultaneas fazem uma chamada so ao Keycloak', async () => {
    const auth = criarServico(TOKEN_ADMIN);
    await auth.iniciar();

    await Promise.all([firstValueFrom(auth.renovar()), firstValueFrom(auth.renovar())]);

    expect(keycloak.updateToken).toHaveBeenCalledTimes(1);
  });

  it('renovar falha quando a sessao acabou no Keycloak', async () => {
    const auth = criarServico(TOKEN_ADMIN);
    await auth.iniciar();
    keycloak.updateToken.mockRejectedValueOnce(new Error('sessao encerrada'));

    await expect(firstValueFrom(auth.renovar())).rejects.toThrow('sessao encerrada');
  });

  it('renovar sem login falha sem chamar o Keycloak', async () => {
    const auth = criarServico(undefined);
    await auth.iniciar();

    await expect(firstValueFrom(auth.renovar())).rejects.toThrow();
    expect(keycloak.updateToken).not.toHaveBeenCalled();
  });

  it('sair encerra a sessao no Keycloak e volta ao inicio do app', async () => {
    const auth = criarServico(TOKEN_ADMIN);
    await auth.iniciar();

    auth.logout();

    expect(auth.logado()).toBe(false);
    expect(keycloak.logout).toHaveBeenCalledWith({ redirectUri: `${location.origin}/` });
  });

  it('sessao expirada volta ao login lembrando a tela atual', async () => {
    const auth = criarServico(TOKEN_ADMIN);
    await auth.iniciar();
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    auth.encerrarSessaoExpirada();

    expect(auth.logado()).toBe(false);
    expect(navegar).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: router.url, expirada: true } });
  });
});

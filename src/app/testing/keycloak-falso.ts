import Keycloak from 'keycloak-js';
import { vi } from 'vitest';

// Keycloak falso para os testes: guarda as chamadas e devolve o token que o teste escolher
export function criarKeycloakFalso(token?: string) {
  const falso = {
    token,
    onAuthLogout: undefined as (() => void) | undefined,
    init: vi.fn(async () => !!falso.token),
    login: vi.fn(async () => undefined),
    logout: vi.fn(async () => undefined),
    updateToken: vi.fn(async () => true),
    isTokenExpired: vi.fn(() => false),
  };
  return falso;
}

export type KeycloakFalso = ReturnType<typeof criarKeycloakFalso>;

export function comoKeycloak(falso: KeycloakFalso): Keycloak {
  return falso as unknown as Keycloak;
}

// JWT so com o payload (o front nao valida assinatura); aceita acentos, como o Keycloak
export function criarJwt(claims: Record<string, unknown>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(claims));
  const base64 = btoa(String.fromCharCode(...bytes)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `cabecalho.${base64}.assinatura`;
}

export const TOKEN_ADMIN = criarJwt({ sub: 'admin-id', given_name: 'Administrador', realm_access: { roles: ['ADMIN'] } });
export const TOKEN_USER = criarJwt({ sub: 'joao-id', given_name: 'João', realm_access: { roles: ['USER'] } });

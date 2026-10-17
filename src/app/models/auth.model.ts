// Tokens emitidos pelo Keycloak e repassados pelo back (/auth/login e /auth/refresh). Tempos em segundos.
export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

// O que fica guardado no navegador entre recarregamentos da pagina
export interface Sessao {
  accessToken: string;
  refreshToken: string;
  // instantes (ms desde 1970) em que cada token deixa de valer
  accessExpiraEm: number;
  refreshExpiraEm: number;
}

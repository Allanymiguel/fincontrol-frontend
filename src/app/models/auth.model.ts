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

// Corpo do POST /auth/registro (formato do RegistroRequestDTO do back)
export interface RegistroRequest {
  nome: string;
  email: string;
  senha: string;
  documento: string;
  telefone: string | null;
  idPerfilFiscal: number;
  idAtividadeMei: number | null;
}

// O que fica guardado no navegador entre recarregamentos da pagina
export interface Sessao {
  accessToken: string;
  refreshToken: string;
  // instantes (ms desde 1970) em que cada token deixa de valer
  accessExpiraEm: number;
  refreshExpiraEm: number;
}

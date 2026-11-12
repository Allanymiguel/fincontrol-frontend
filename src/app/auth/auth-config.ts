// Chave geral do login no front.
// true  = exige login (Keycloak rodando, back no modo normal).
// false = usa o app sem login: combine com FINCONTROL_AUTH=false no quarkus:dev do back.
export const AUTH_HABILITADA = true;

// Client publico do front no realm (Authorization Code com PKCE): a senha e digitada so na tela
// do Keycloak, que tem o tema do FinControl. O front recebe apenas os tokens.
export const KEYCLOAK_CONFIG = {
  url: 'http://localhost:8180',
  realm: 'fincontrol',
  clientId: 'fincontrol-frontend',
};

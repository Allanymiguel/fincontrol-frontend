// Chave geral do login no front.
// true  = exige login (Keycloak rodando, back no modo normal).
// false = usa o app sem login: combine com FINCONTROL_AUTH=false no quarkus:dev do back.
export const AUTH_HABILITADA = true;

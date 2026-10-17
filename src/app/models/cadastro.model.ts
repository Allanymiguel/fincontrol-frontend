// Corpos das duas formas de cadastro de usuario (CadastroSimplesDTO / CadastroCompletoDTO do back)
// e das edicoes pelo admin. idPapel so e lido no cadastro pelo admin (1 = USER, 2 = ADMIN).

export interface CadastroSimplesRequest {
  nome: string;
  email: string;
  senha: string;
  idPapel?: number | null;
}

// dados fiscais e endereco (o municipio vem da consulta do CEP)
export interface DadosCompletosRequest {
  documento: string;
  telefone: string | null;
  idPerfilFiscal: number;
  idAtividadeMei: number | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  idMunicipio: number;
}

export type CadastroCompletoRequest = CadastroSimplesRequest & DadosCompletosRequest;

export interface EdicaoSimplesRequest {
  nome: string;
  email: string;
}

export type EdicaoCompletaRequest = EdicaoSimplesRequest & DadosCompletosRequest;

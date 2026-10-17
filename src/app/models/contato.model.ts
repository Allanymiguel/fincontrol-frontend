import { Municipio } from './municipio.model';
import { TipoContato } from './tipo-contato';

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  municipio: Municipio;
}

// documento e endereco so existem no cadastro completo
export interface Contato {
  id: number;
  nome: string;
  tipo: TipoContato;
  documento: string | null;
  email: string | null;
  telefone: string | null;
  endereco: Endereco | null;
  cadastroCompleto: boolean;
}

// Corpo do POST/PUT .../simples (ContatoSimplesDTO do back)
export interface ContatoSimplesRequest {
  nome: string;
  idTipo: number;
  telefone: string;
  email: string | null;
}

// Corpo do POST/PUT .../completo (ContatoCompletoDTO do back)
export interface ContatoCompletoRequest {
  nome: string;
  idTipo: number;
  documento: string;
  email: string | null;
  telefone: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  idMunicipio: number;
}

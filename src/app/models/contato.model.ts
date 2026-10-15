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

export interface Contato {
  id: number;
  nome: string;
  tipo: TipoContato;
  documento: string;
  email: string | null;
  telefone: string | null;
  endereco: Endereco;
}

// Corpo enviado no POST/PUT (formato do ContatoRequestDTO do back)
export interface ContatoRequest {
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

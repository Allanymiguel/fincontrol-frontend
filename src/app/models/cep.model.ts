import { Municipio } from './municipio.model';

// Resposta de GET /cep/{cep}: dados do ViaCEP com o municipio ja resolvido no banco
export interface CepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  municipio: Municipio;
}

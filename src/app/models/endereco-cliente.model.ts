import { ItemEnum } from './auditoria.model';
import { Municipio } from './municipio.model';

// Busca de CEP do cadastro de CLIENTE (GET /enderecos-cliente/cep/{cep}). Os contatos continuam
// usando GET /cep/{cep} (CepResponse).
// encontrado: veio da base local ou do ViaCEP; os campos bloqueados vem preenchidos (o back ignora
// o que for mandado neles). modoManual: o cliente escolhe o municipio da UF e digita o resto.
export interface EnderecoClienteResponse {
  cep: string;
  encontrado: boolean;
  fonte: ItemEnum | null;
  origem: ItemEnum | null;
  situacao: ItemEnum | null;
  logradouro: string | null;
  bairro: string | null;
  municipio: Municipio | null;
  logradouroBloqueado: boolean;
  bairroBloqueado: boolean;
  modoManual: boolean;
  uf: string;
  mensagem: string | null;
}

// ===== gestao da base (admin) =====

export interface CepLocal {
  id: number;
  cep: string;
  logradouro: string | null;
  bairro: string | null;
  municipio: Municipio;
  origem: ItemEnum;
  situacao: ItemEnum;
  dataCadastro: string | null;
  dataAlteracao: string | null;
  dataRevalidacao: string | null;
  // o que o ViaCEP devolveu na revalidacao divergente
  divergencia: { logradouro: string | null; bairro: string | null; municipio: string | null } | null;
}

export interface CepLocalRequest {
  logradouro: string | null;
  bairro: string | null;
  idMunicipio: number;
  verificar: boolean;
}

export interface RevalidacaoLote {
  conferidos: number;
  verificados: number;
  divergentes: number;
  falhas: number;
}

export interface ImportacaoCep {
  importados: number;
  atualizados: number;
  rejeitados: { linha: number; cep: string | null; motivo: string }[];
}

export interface ConsultaCep {
  id: number;
  cep: string;
  dataHora: string;
  fonte: ItemEnum;
  resultado: ItemEnum;
}

// ids dos enums do back (OrigemCep, SituacaoCep, FonteConsultaCep, ResultadoConsultaCep)
export const ORIGENS_CEP: ItemEnum[] = [
  { id: 1, nome: 'API (ViaCEP)' },
  { id: 2, nome: 'Manual' },
  { id: 3, nome: 'Importação' },
];
export const SITUACOES_CEP: ItemEnum[] = [
  { id: 1, nome: 'Verificado' },
  { id: 2, nome: 'Não verificado' },
  { id: 3, nome: 'Divergente' },
];
export const FONTES_CONSULTA: ItemEnum[] = [
  { id: 1, nome: 'Base local' },
  { id: 2, nome: 'ViaCEP' },
];
export const RESULTADOS_CONSULTA: ItemEnum[] = [
  { id: 1, nome: 'Encontrado' },
  { id: 2, nome: 'Não encontrado' },
  { id: 3, nome: 'Falha' },
];
export const SITUACAO_VERIFICADO = 1;
export const SITUACAO_NAO_VERIFICADO = 2;
export const SITUACAO_DIVERGENTE = 3;
export const ORIGEM_MANUAL = 2;

export const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI',
  'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];

// "77001002" -> "77001-002"
export function formatarCep(cep: string | null | undefined): string {
  if (!cep) return '';
  return cep.length === 8 ? `${cep.substring(0, 5)}-${cep.substring(5)}` : cep;
}

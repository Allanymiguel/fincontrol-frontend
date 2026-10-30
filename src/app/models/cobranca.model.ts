import { ItemEnum } from './auditoria.model';

// Uma execucao da cobranca (automatica das 03:00 ou manual) no historico
export interface ExecucaoCobranca {
  id: number;
  // "yyyy-MM-dd": ate quando cobrou
  dataReferencia: string;
  inicio: string;
  fim: string;
  duracaoMs: number;
  origem: ItemEnum;
  status: ItemEnum;
  disparadoPor: string;
  assinaturasProcessadas: number;
  pagamentosGerados: number;
  valorTotal: number;
  trocasAplicadas: number;
  voltasAoGratuito: number;
  // tentativas recusadas (simulacao): nao sao erro da execucao
  pagamentosRecusados: number;
  // falha da execucao inteira
  mensagemErro: string | null;
  // assinaturas que falharam (as outras seguiram)
  erros: { idAssinatura: number; usuario: string | null; mensagem: string }[];
}

// "a cobranca de ontem rodou direito?"
export interface ResumoCobranca {
  ontem: string;
  automaticaDeOntem: ExecucaoCobranca | null;
  falhasNoPeriodo: number;
  diasSemAutomatica: string[];
  inicioPeriodo: string;
}

export interface ResultadoCobranca {
  data: string;
  assinaturasProcessadas: number;
  pagamentosGerados: number;
  valorTotal: number;
  trocasAplicadas: number;
  voltasAoGratuito: number;
  pagamentosRecusados: number;
  idExecucao: number;
  status: ItemEnum;
}

// ids dos enums do back (OrigemExecucaoCobranca, StatusExecucaoCobranca)
export const ORIGENS_EXECUCAO: ItemEnum[] = [
  { id: 1, nome: 'Automática' },
  { id: 2, nome: 'Manual' },
];
export const STATUS_EXECUCAO: ItemEnum[] = [
  { id: 1, nome: 'Sucesso' },
  { id: 2, nome: 'Parcial' },
  { id: 3, nome: 'Falha' },
];
export const STATUS_SUCESSO = 1;
export const STATUS_PARCIAL = 2;
export const STATUS_FALHA = 3;

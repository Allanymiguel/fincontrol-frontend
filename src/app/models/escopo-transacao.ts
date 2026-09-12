export type EscopoTransacao = 'PESSOAL' | 'EMPRESA';

export const ESCOPOS_TRANSACAO: EscopoTransacao[] = ['PESSOAL', 'EMPRESA'];

export const ESCOPO_TRANSACAO_LABELS: Record<EscopoTransacao, string> = {
  PESSOAL: 'Pessoal',
  EMPRESA: 'Empresa',
};

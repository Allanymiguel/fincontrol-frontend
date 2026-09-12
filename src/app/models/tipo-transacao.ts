export type TipoTransacao = 'DESPESA' | 'RECEITA';

export const TIPOS_TRANSACAO: TipoTransacao[] = ['DESPESA', 'RECEITA'];

export const TIPO_TRANSACAO_LABELS: Record<TipoTransacao, string> = {
  DESPESA: 'Despesa',
  RECEITA: 'Receita',
};

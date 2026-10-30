export class StatusAssinatura {
  id!: number;
  nome!: string;
}

// Pendente = pagamento recusado aguardando nova tentativa (so com a simulacao de recusa ligada)
export const STATUS_ASSINATURA: StatusAssinatura[] = [
  { id: 1, nome: 'Pendente' },
  { id: 2, nome: 'Ativa' },
  { id: 3, nome: 'Cancelada' },
];

export const ASSINATURA_PENDENTE = 1;

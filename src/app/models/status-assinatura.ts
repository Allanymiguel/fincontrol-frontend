export class StatusAssinatura {
  id!: number;
  nome!: string;
}

export const STATUS_ASSINATURA: StatusAssinatura[] = [
  { id: 1, nome: 'Pendente' },
  { id: 2, nome: 'Ativa' },
  { id: 3, nome: 'Cancelada' },
  { id: 4, nome: 'Suspensa' },
  { id: 5, nome: 'Expirada' },
];

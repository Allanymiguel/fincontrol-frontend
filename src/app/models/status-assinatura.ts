export class StatusAssinatura {
  id!: number;
  nome!: string;
}

// como no UML: com a cobranca simulada, toda assinatura fica Ativa (Pendente e reservado ao pagamento real)
export const STATUS_ASSINATURA: StatusAssinatura[] = [
  { id: 1, nome: 'Pendente' },
  { id: 2, nome: 'Ativa' },
  { id: 3, nome: 'Cancelada' },
];

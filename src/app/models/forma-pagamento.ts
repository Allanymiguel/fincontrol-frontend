export class FormaPagamento {
  id!: number;
  nome!: string;
}

export const FORMAS_PAGAMENTO: FormaPagamento[] = [
  { id: 1, nome: 'Pix' },
  { id: 2, nome: 'Cartão' },
  { id: 3, nome: 'Boleto' },
];

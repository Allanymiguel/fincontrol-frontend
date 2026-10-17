export class FormaPagamento {
  id!: number;
  nome!: string;
}

export const FORMAS_PAGAMENTO: FormaPagamento[] = [
  { id: 1, nome: 'Pix' },
  { id: 2, nome: 'Cartão' },
  { id: 3, nome: 'Boleto' },
  { id: 4, nome: 'Nenhuma' },
];

// id 4 = NENHUMA: so para assinaturas sem custo (plano Gratuito ou cupom de 100%)
export const FORMA_PAGAMENTO_NENHUMA = 4;

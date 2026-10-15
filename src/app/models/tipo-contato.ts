export class TipoContato {
  id!: number;
  nome!: string;
}

export const TIPOS_CONTATO: TipoContato[] = [
  { id: 1, nome: 'Cliente' },
  { id: 2, nome: 'Fornecedor' },
];

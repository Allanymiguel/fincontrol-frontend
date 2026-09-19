export class TipoTransacao {
    id!: number;
    nome!: string;
}

export const TIPOS_TRANSACAO: TipoTransacao[] = [
    { id: 1, nome: 'Receita' },
    { id: 2, nome: 'Despesa' },
];

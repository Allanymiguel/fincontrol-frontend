import { TipoTransacao } from './tipo-transacao';

export class Categoria {
    id!: number;
    nome!: string;
    tipo!: TipoTransacao;
    cor!: string;
    ativa!: boolean;
}

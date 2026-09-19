import { TipoTransacao } from './tipo-transacao';

export class Categoria {
    id!: number;
    nome!: string;
    idTipo?: number;
    tipo?: TipoTransacao;
    cor?: string;
    ativa!: boolean;
}

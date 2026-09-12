import { Categoria } from './categoria.model';
import { TipoTransacao } from './tipo-transacao';
import { EscopoTransacao } from './escopo-transacao';

export class Transacao {
    id!: number;
    descricao!: string;
    valor!: number;
    data!: string;
    tipo!: TipoTransacao;
    escopo!: EscopoTransacao;
    categoria!: Categoria;
}

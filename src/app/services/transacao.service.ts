import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Transacao } from '../models/transacao.model';
import { PagedResponse } from './categoria.service';

type TransacaoPayload = Omit<Transacao, 'tipo' | 'escopo' | 'categoria'> & {
    tipo?: Transacao['tipo'];
    escopo?: Transacao['escopo'];
    categoria?: Transacao['categoria'];
    idTipo?: number;
    idEscopo?: number;
    idCategoria?: number;
};

export interface TransacaoFilter {
    descricao?: string;
    idCategoria?: number;
}

@Injectable({ providedIn: 'root' })
export class TransacaoService {
    private readonly apiUrl: string = 'http://localhost:8080/transacoes';

    constructor(private http: HttpClient) {}

    private toPayload(transacao: Transacao): TransacaoPayload {
        return {
            ...transacao,
            idTipo: transacao.idTipo ?? transacao.tipo?.id,
            idEscopo: transacao.idEscopo ?? transacao.escopo?.id,
            idCategoria: transacao.idCategoria ?? transacao.categoria?.id,
        };
    }

    findAll(
        page: number = 0,
        pageSize: number = 10,
        filter: TransacaoFilter = {},
    ): Observable<PagedResponse<Transacao>> {
        let params = new HttpParams()
            .set('page', page)
            .set('pageSize', pageSize);

        if (filter.descricao && filter.descricao.trim().length > 0) {
            params = params.set('descricao', filter.descricao.trim());
        }
        if (filter.idCategoria != null) {
            params = params.set('idCategoria', filter.idCategoria);
        }

        return this.http.get<PagedResponse<Transacao>>(this.apiUrl, { params });
    }

    findById(id: number | string): Observable<Transacao> {
        return this.http.get<Transacao>(`${this.apiUrl}/${id}`);
    }

    create(transacao: Transacao): Observable<Transacao> {
        return this.http.post<Transacao>(this.apiUrl, this.toPayload(transacao));
    }

    update(id: number, transacao: Transacao): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, this.toPayload(transacao));
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}

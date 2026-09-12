import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Transacao } from '../models/transacao.model';
import { Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class TransacaoService {
    private readonly apiUrl: string = 'http://localhost:8080/transacoes';

    constructor(private http: HttpClient) {}

    findAll(): Observable<Transacao[]> {
        return this.http.get<Transacao[]>(this.apiUrl);
    }

    findById(id: number): Observable<Transacao> {
        const url = `${this.apiUrl}/${id}`;
        return this.http.get<Transacao>(url);
    }

    create(transacao: any): Observable<Transacao> {
        return this.http.post<Transacao>(this.apiUrl, transacao);
    }

    update(id: number, transacao: any): Observable<void> {
        const url = `${this.apiUrl}/${id}`;
        return this.http.put<void>(url, transacao);
    }

    delete(id: number): Observable<void> {
        const url = `${this.apiUrl}/${id}`;
        return this.http.delete<void>(url);
    }
}

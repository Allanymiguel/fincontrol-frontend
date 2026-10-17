import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Contato, ContatoCompletoRequest, ContatoSimplesRequest } from '../models/contato.model';
import { PagedResponse } from './categoria.service';

@Injectable({ providedIn: 'root' })
export class ContatoService {
  private readonly apiUrl: string = 'http://localhost:8080/contatos';

  constructor(private http: HttpClient) {}

  findAll(page: number = 0, pageSize: number = 10, nome?: string): Observable<PagedResponse<Contato>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    if (nome && nome.trim().length > 0) {
      params = params.set('nome', nome.trim());
    }

    return this.http.get<PagedResponse<Contato>>(this.apiUrl, { params });
  }

  findById(id: number | string): Observable<Contato> {
    return this.http.get<Contato>(`${this.apiUrl}/${id}`);
  }

  // simples = nome, tipo e telefone; completo = tambem CPF/CNPJ e endereco
  createSimples(contato: ContatoSimplesRequest): Observable<Contato> {
    return this.http.post<Contato>(`${this.apiUrl}/simples`, contato);
  }

  createCompleto(contato: ContatoCompletoRequest): Observable<Contato> {
    return this.http.post<Contato>(`${this.apiUrl}/completo`, contato);
  }

  updateSimples(id: number, contato: ContatoSimplesRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/simples`, contato);
  }

  // tambem completa um contato simples
  updateCompleto(id: number, contato: ContatoCompletoRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/completo`, contato);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

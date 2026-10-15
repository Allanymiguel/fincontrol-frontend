import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Contato, ContatoRequest } from '../models/contato.model';
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

  create(contato: ContatoRequest): Observable<Contato> {
    return this.http.post<Contato>(this.apiUrl, contato);
  }

  update(id: number, contato: ContatoRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, contato);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

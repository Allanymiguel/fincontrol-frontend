import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Assinatura, AssinaturaRequest, AssinaturaUpdate } from '../models/assinatura.model';
import { PagedResponse } from './categoria.service';

@Injectable({ providedIn: 'root' })
export class AssinaturaService {
  private readonly apiUrl: string = 'http://localhost:8080/admin/assinaturas';

  constructor(private http: HttpClient) {}

  // busca = parte do nome do usuario ou do plano
  findAll(
    page: number = 0,
    pageSize: number = 10,
    busca?: string,
    idStatus?: number | null,
  ): Observable<PagedResponse<Assinatura>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    if (busca && busca.trim().length > 0) {
      params = params.set('busca', busca.trim());
    }

    if (idStatus) {
      params = params.set('idStatus', idStatus);
    }

    return this.http.get<PagedResponse<Assinatura>>(this.apiUrl, { params });
  }

  findById(id: number | string): Observable<Assinatura> {
    return this.http.get<Assinatura>(`${this.apiUrl}/${id}`);
  }

  create(assinatura: AssinaturaRequest): Observable<Assinatura> {
    return this.http.post<Assinatura>(this.apiUrl, assinatura);
  }

  update(id: number, assinatura: AssinaturaUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, assinatura);
  }

  // em vez de excluir: muda para CANCELADA e fecha a data de fim (mantem o historico)
  cancelar(id: number): Observable<Assinatura> {
    return this.http.patch<Assinatura>(`${this.apiUrl}/${id}/cancelar`, null);
  }
}

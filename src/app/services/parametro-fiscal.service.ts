import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ParametroFiscal, ParametroFiscalRequest } from '../models/parametro-fiscal.model';
import { PagedResponse } from './categoria.service';

@Injectable({ providedIn: 'root' })
export class ParametroFiscalService {
  private readonly apiUrl: string = 'http://localhost:8080/parametros-fiscais';

  constructor(private http: HttpClient) {}

  findAll(page: number = 0, pageSize: number = 10, chave?: string): Observable<PagedResponse<ParametroFiscal>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    if (chave && chave.trim().length > 0) {
      params = params.set('chave', chave.trim());
    }

    return this.http.get<PagedResponse<ParametroFiscal>>(this.apiUrl, { params });
  }

  findById(id: number | string): Observable<ParametroFiscal> {
    return this.http.get<ParametroFiscal>(`${this.apiUrl}/${id}`);
  }

  create(parametro: ParametroFiscalRequest): Observable<ParametroFiscal> {
    return this.http.post<ParametroFiscal>(this.apiUrl, parametro);
  }

  update(id: number, parametro: ParametroFiscalRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, parametro);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

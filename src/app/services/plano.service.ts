import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Plano, PlanoRequest } from '../models/plano.model';
import { PagedResponse } from './categoria.service';

@Injectable({ providedIn: 'root' })
export class PlanoService {
  private readonly apiUrl: string = 'http://localhost:8080/planos';

  constructor(private http: HttpClient) {}

  findAll(page: number = 0, pageSize: number = 10, nome?: string): Observable<PagedResponse<Plano>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    if (nome && nome.trim().length > 0) {
      params = params.set('nome', nome.trim());
    }

    return this.http.get<PagedResponse<Plano>>(this.apiUrl, { params });
  }

  findById(id: number | string): Observable<Plano> {
    return this.http.get<Plano>(`${this.apiUrl}/${id}`);
  }

  create(plano: PlanoRequest): Observable<Plano> {
    return this.http.post<Plano>(this.apiUrl, plano);
  }

  update(id: number, plano: PlanoRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, plano);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

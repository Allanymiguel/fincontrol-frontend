import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cupom, CupomRequest } from '../models/cupom.model';
import { PagedResponse } from './categoria.service';

@Injectable({ providedIn: 'root' })
export class CupomService {
  private readonly apiUrl: string = 'http://localhost:8080/cupons';

  constructor(private http: HttpClient) {}

  findAll(page: number = 0, pageSize: number = 10, codigo?: string): Observable<PagedResponse<Cupom>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    if (codigo && codigo.trim().length > 0) {
      params = params.set('codigo', codigo.trim());
    }

    return this.http.get<PagedResponse<Cupom>>(this.apiUrl, { params });
  }

  findById(id: number | string): Observable<Cupom> {
    return this.http.get<Cupom>(`${this.apiUrl}/${id}`);
  }

  create(cupom: CupomRequest): Observable<Cupom> {
    return this.http.post<Cupom>(this.apiUrl, cupom);
  }

  update(id: number, cupom: CupomRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, cupom);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

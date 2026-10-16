import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FaixaIrpf, FaixaIrpfRequest } from '../models/faixa-irpf.model';
import { PagedResponse } from './categoria.service';

@Injectable({ providedIn: 'root' })
export class FaixaIrpfService {
  private readonly apiUrl: string = 'http://localhost:8080/faixas-irpf';

  constructor(private http: HttpClient) {}

  // vigencia ("yyyy-MM-dd") = inicio de vigencia da tabela; sem ela, todas as faixas
  findAll(page: number = 0, pageSize: number = 10, vigencia?: string | null): Observable<PagedResponse<FaixaIrpf>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    if (vigencia) {
      params = params.set('vigencia', vigencia);
    }

    return this.http.get<PagedResponse<FaixaIrpf>>(this.apiUrl, { params });
  }

  // datas de inicio das tabelas cadastradas, da mais recente para a mais antiga
  findVigencias(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/vigencias`);
  }

  findById(id: number | string): Observable<FaixaIrpf> {
    return this.http.get<FaixaIrpf>(`${this.apiUrl}/${id}`);
  }

  create(faixa: FaixaIrpfRequest): Observable<FaixaIrpf> {
    return this.http.post<FaixaIrpf>(this.apiUrl, faixa);
  }

  update(id: number, faixa: FaixaIrpfRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, faixa);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

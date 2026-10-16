import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CategoriaPadrao, CategoriaPadraoRequest } from '../models/categoria-padrao.model';
import { PagedResponse } from './categoria.service';

@Injectable({ providedIn: 'root' })
export class CategoriaPadraoService {
  private readonly apiUrl: string = 'http://localhost:8080/categorias-padrao';

  constructor(private http: HttpClient) {}

  findAll(
    page: number = 0,
    pageSize: number = 10,
    nome?: string,
    idTipo?: number | null,
  ): Observable<PagedResponse<CategoriaPadrao>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    if (nome && nome.trim().length > 0) {
      params = params.set('nome', nome.trim());
    }

    if (idTipo) {
      params = params.set('idTipo', idTipo);
    }

    return this.http.get<PagedResponse<CategoriaPadrao>>(this.apiUrl, { params });
  }

  findById(id: number | string): Observable<CategoriaPadrao> {
    return this.http.get<CategoriaPadrao>(`${this.apiUrl}/${id}`);
  }

  create(categoria: CategoriaPadraoRequest): Observable<CategoriaPadrao> {
    return this.http.post<CategoriaPadrao>(this.apiUrl, categoria);
  }

  update(id: number, categoria: CategoriaPadraoRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, categoria);
  }

  // arquiva se estiver ativa, desarquiva se estiver arquivada; devolve o novo estado
  alternarArquivada(id: number): Observable<CategoriaPadrao> {
    return this.http.patch<CategoriaPadrao>(`${this.apiUrl}/${id}/arquivar`, null);
  }
}

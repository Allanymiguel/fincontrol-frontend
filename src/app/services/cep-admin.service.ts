import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CepLocal,
  CepLocalRequest,
  ConsultaCep,
  ImportacaoCep,
  RevalidacaoLote,
} from '../models/endereco-cliente.model';
import { PagedResponse } from './categoria.service';

export interface FiltroCep {
  cep?: string | null;
  idOrigem?: number | null;
  idSituacao?: number | null;
  uf?: string | null;
}

export interface FiltroConsultaCep {
  cep?: string | null;
  idFonte?: number | null;
  idResultado?: number | null;
  inicio?: string | null;
  fim?: string | null;
}

// Gestao da base de CEPs de clientes (so admin). Cada acao vira evento de auditoria no back.
@Injectable({ providedIn: 'root' })
export class CepAdminService {
  private readonly apiUrl: string = 'http://localhost:8080/admin/ceps';

  constructor(private http: HttpClient) {}

  findAll(page: number, pageSize: number, filtro: FiltroCep): Observable<PagedResponse<CepLocal>> {
    return this.http.get<PagedResponse<CepLocal>>(this.apiUrl, { params: this.params(page, pageSize, filtro) });
  }

  corrigir(id: number, dados: CepLocalRequest): Observable<CepLocal> {
    return this.http.put<CepLocal>(`${this.apiUrl}/${id}`, dados);
  }

  verificar(id: number): Observable<CepLocal> {
    return this.http.patch<CepLocal>(`${this.apiUrl}/${id}/verificacao`, null);
  }

  revalidar(id: number): Observable<CepLocal> {
    return this.http.post<CepLocal>(`${this.apiUrl}/${id}/revalidacao`, null);
  }

  revalidarManuais(): Observable<RevalidacaoLote> {
    return this.http.post<RevalidacaoLote>(`${this.apiUrl}/revalidacao`, null);
  }

  importar(arquivo: File): Observable<ImportacaoCep> {
    const corpo = new FormData();
    corpo.append('arquivo', arquivo);
    return this.http.post<ImportacaoCep>(`${this.apiUrl}/importacao`, corpo);
  }

  configuracao(): Observable<{ apiExternaHabilitada: boolean }> {
    return this.http.get<{ apiExternaHabilitada: boolean }>(`${this.apiUrl}/configuracao`);
  }

  definirApiExterna(habilitada: boolean): Observable<{ apiExternaHabilitada: boolean }> {
    return this.http.put<{ apiExternaHabilitada: boolean }>(`${this.apiUrl}/configuracao`, {
      apiExternaHabilitada: habilitada,
    });
  }

  consultas(page: number, pageSize: number, filtro: FiltroConsultaCep): Observable<PagedResponse<ConsultaCep>> {
    return this.http.get<PagedResponse<ConsultaCep>>(`${this.apiUrl}/consultas`, {
      params: this.params(page, pageSize, filtro),
    });
  }

  private params(page: number, pageSize: number, filtro: object): HttpParams {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    for (const [chave, valor] of Object.entries(filtro)) {
      if (valor != null && String(valor).trim().length > 0) params = params.set(chave, String(valor).trim());
    }
    return params;
  }
}

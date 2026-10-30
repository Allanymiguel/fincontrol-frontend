import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExecucaoCobranca, ResultadoCobranca, ResumoCobranca } from '../models/cobranca.model';
import { PagedResponse } from './categoria.service';

export interface FiltroExecucao {
  inicio?: string | null;
  fim?: string | null;
  idOrigem?: number | null;
  idStatus?: number | null;
}

// Cobranca das assinaturas: disparo manual e historico das execucoes (so admin)
@Injectable({ providedIn: 'root' })
export class CobrancaService {
  private readonly apiUrl: string = 'http://localhost:8080/admin/cobrancas';

  constructor(private http: HttpClient) {}

  // cobra o que venceu ate hoje; fica no historico e na auditoria
  processar(): Observable<ResultadoCobranca> {
    return this.http.post<ResultadoCobranca>(`${this.apiUrl}/processar`, null);
  }

  resumo(): Observable<ResumoCobranca> {
    return this.http.get<ResumoCobranca>(`${this.apiUrl}/resumo`);
  }

  execucoes(page: number, pageSize: number, filtro: FiltroExecucao): Observable<PagedResponse<ExecucaoCobranca>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    for (const [chave, valor] of Object.entries(filtro)) {
      if (valor != null && String(valor).length > 0) params = params.set(chave, String(valor));
    }
    return this.http.get<PagedResponse<ExecucaoCobranca>>(`${this.apiUrl}/execucoes`, { params });
  }
}

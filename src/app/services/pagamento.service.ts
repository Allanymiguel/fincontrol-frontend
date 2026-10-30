import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagamento, TotalPorStatus } from '../models/pagamento.model';
import { PagedResponse } from './categoria.service';

export interface FiltroPagamento {
  inicio?: string | null;
  fim?: string | null;
  idPlano?: number | null;
  idFormaPagamento?: number | null;
  idStatus?: number | null;
  busca?: string | null;
}

// Pagamentos de todas as assinaturas e o estorno (so admin)
@Injectable({ providedIn: 'root' })
export class PagamentoService {
  private readonly apiUrl: string = 'http://localhost:8080/admin/pagamentos';

  constructor(private http: HttpClient) {}

  buscar(page: number, pageSize: number, filtro: FiltroPagamento): Observable<PagedResponse<Pagamento>> {
    const params = this.params(filtro).set('page', page).set('pageSize', pageSize);
    return this.http.get<PagedResponse<Pagamento>>(this.apiUrl, { params });
  }

  // mesmos filtros, menos a situacao
  resumo(filtro: FiltroPagamento): Observable<TotalPorStatus[]> {
    return this.http.get<TotalPorStatus[]>(`${this.apiUrl}/resumo`, { params: this.params({ ...filtro, idStatus: null }) });
  }

  // so o registro financeiro: a assinatura nao muda
  estornar(id: number, motivo: string): Observable<Pagamento> {
    return this.http.post<Pagamento>(`${this.apiUrl}/${id}/estorno`, { motivo });
  }

  private params(filtro: FiltroPagamento): HttpParams {
    let params = new HttpParams();
    for (const [chave, valor] of Object.entries(filtro)) {
      if (valor != null && String(valor).trim().length > 0) params = params.set(chave, String(valor).trim());
    }
    return params;
  }
}

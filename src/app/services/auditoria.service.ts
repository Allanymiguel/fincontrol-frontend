import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EventoAuditoria, FiltroAuditoria, FiltrosAuditoria } from '../models/auditoria.model';
import { PagedResponse } from './categoria.service';

// Consulta da auditoria das acoes do admin. Somente leitura: nao ha como alterar ou apagar eventos.
@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly apiUrl: string = 'http://localhost:8080/admin/auditoria';

  constructor(private http: HttpClient) {}

  findAll(page: number = 0, pageSize: number = 10, filtro: FiltroAuditoria = {}): Observable<PagedResponse<EventoAuditoria>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    for (const [chave, valor] of Object.entries(filtro)) {
      if (valor != null && String(valor).trim().length > 0) params = params.set(chave, String(valor).trim());
    }
    return this.http.get<PagedResponse<EventoAuditoria>>(this.apiUrl, { params });
  }

  findById(id: number): Observable<EventoAuditoria> {
    return this.http.get<EventoAuditoria>(`${this.apiUrl}/${id}`);
  }

  // acoes, tipos de alvo e os admins que ja tem eventos
  filtros(): Observable<FiltrosAuditoria> {
    return this.http.get<FiltrosAuditoria>(`${this.apiUrl}/filtros`);
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Dashboard } from '../models/dashboard.model';

// Indicadores do painel do admin (tela inicial do ADMIN)
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl: string = 'http://localhost:8080/admin/dashboard';

  constructor(private http: HttpClient) {}

  // inicio e fim em "yyyy-MM-dd"; sem eles, o back usa os ultimos 6 meses
  buscar(inicio?: string, fim?: string): Observable<Dashboard> {
    let params = new HttpParams();
    if (inicio) params = params.set('inicio', inicio);
    if (fim) params = params.set('fim', fim);
    return this.http.get<Dashboard>(this.apiUrl, { params });
  }
}

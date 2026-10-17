import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Assinatura, TrocaPlanoRequest, TrocaPlanoResultado } from '../models/assinatura.model';

// A assinatura (unica) de um usuario, gerida pelo admin (RN16): troca de plano no estilo da
// Netflix, cancelamento do plano pago e observacao. Ela nasce no cadastro e nao e excluida.
@Injectable({ providedIn: 'root' })
export class AssinaturaService {
  private readonly apiUrl: string = 'http://localhost:8080/admin/usuarios';

  constructor(private http: HttpClient) {}

  buscar(idUsuario: number): Observable<Assinatura> {
    return this.http.get<Assinatura>(this.url(idUsuario));
  }

  // previa (vale agora ou fica agendada, credito, proxima cobranca) sem alterar nada
  simularTroca(idUsuario: number, troca: TrocaPlanoRequest): Observable<TrocaPlanoResultado> {
    return this.http.post<TrocaPlanoResultado>(`${this.url(idUsuario)}/troca/simulacao`, troca);
  }

  trocarPlano(idUsuario: number, troca: TrocaPlanoRequest): Observable<TrocaPlanoResultado> {
    return this.http.post<TrocaPlanoResultado>(`${this.url(idUsuario)}/troca`, troca);
  }

  // desfaz a troca agendada para a proxima cobranca
  desfazerTroca(idUsuario: number): Observable<Assinatura> {
    return this.http.delete<Assinatura>(`${this.url(idUsuario)}/troca`);
  }

  // volta ao Gratuito na proxima cobranca
  cancelarPlanoPago(idUsuario: number): Observable<TrocaPlanoResultado> {
    return this.http.post<TrocaPlanoResultado>(`${this.url(idUsuario)}/cancelamento`, null);
  }

  salvarObservacao(idUsuario: number, observacao: string | null): Observable<Assinatura> {
    return this.http.patch<Assinatura>(`${this.url(idUsuario)}/observacao`, { observacao });
  }

  private url(idUsuario: number): string {
    return `${this.apiUrl}/${idUsuario}/assinatura`;
  }
}

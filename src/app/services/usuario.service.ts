import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { UsuarioResumo } from '../models/usuario-resumo.model';
import { PagedResponse } from './categoria.service';

// Gestao de usuarios pelo admin: so consulta e ativacao
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiUrl: string = 'http://localhost:8080/admin/usuarios';

  constructor(private http: HttpClient) {}

  // busca = parte do nome ou do email
  findAll(page: number = 0, pageSize: number = 10, busca?: string): Observable<PagedResponse<Usuario>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    if (busca && busca.trim().length > 0) {
      params = params.set('busca', busca.trim());
    }

    return this.http.get<PagedResponse<Usuario>>(this.apiUrl, { params });
  }

  findById(id: number | string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  // perfil + assinaturas + contagens (sem o conteudo dos registros pessoais)
  buscarResumo(id: number | string): Observable<UsuarioResumo> {
    return this.http.get<UsuarioResumo>(`${this.apiUrl}/${id}/resumo`);
  }

  // ativa se estiver inativo, desativa se estiver ativo; devolve o novo estado
  alternarAtivo(id: number): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}/ativar`, null);
  }
}

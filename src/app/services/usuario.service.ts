import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CadastroCompletoRequest,
  CadastroSimplesRequest,
  EdicaoCompletaRequest,
  EdicaoSimplesRequest,
} from '../models/cadastro.model';
import { Usuario } from '../models/usuario.model';
import { UsuarioResumo } from '../models/usuario-resumo.model';
import { PagedResponse } from './categoria.service';

// Gestao de usuarios pelo admin: consulta, criacao (simples ou completa, papel USER ou ADMIN),
// edicao e ativacao
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiUrl: string = 'http://localhost:8080/admin/usuarios';

  constructor(private http: HttpClient) {}

  // busca = parte do nome ou do email; idPlano = plano vigente da assinatura
  findAll(
    page: number = 0,
    pageSize: number = 10,
    busca?: string,
    idPlano?: number | null,
  ): Observable<PagedResponse<Usuario>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    if (busca && busca.trim().length > 0) {
      params = params.set('busca', busca.trim());
    }

    if (idPlano != null) {
      params = params.set('idPlano', idPlano);
    }

    return this.http.get<PagedResponse<Usuario>>(this.apiUrl, { params });
  }

  findById(id: number | string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  // perfil + assinatura + pagamentos + contagens (sem o conteudo dos registros pessoais)
  buscarResumo(id: number | string): Observable<UsuarioResumo> {
    return this.http.get<UsuarioResumo>(`${this.apiUrl}/${id}/resumo`);
  }

  cadastrarSimples(dados: CadastroSimplesRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/simples`, dados);
  }

  cadastrarCompleto(dados: CadastroCompletoRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/completo`, dados);
  }

  // so para cadastro simples: nome e e-mail
  editarSimples(id: number, dados: EdicaoSimplesRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}/simples`, dados);
  }

  // completa um cadastro simples ou atualiza um completo
  editarCompleto(id: number, dados: EdicaoCompletaRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}/completo`, dados);
  }

  // ativa se estiver inativo, desativa se estiver ativo; devolve o novo estado
  alternarAtivo(id: number): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}/ativar`, null);
  }
}

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

// filtros da listagem do admin: ativo null = todos; incompleto = cliente sem documento, perfil fiscal
// ou endereco; agendamento = troca ou cancelamento agendado
export interface FiltroUsuario {
  ativo?: boolean | null;
  incompleto?: boolean;
  agendamento?: boolean;
}

// categoria: "conta", "assinatura", "pagamento" ou "admin"
export interface EventoLinhaDoTempo {
  dataHora: string;
  categoria: string;
  titulo: string;
  descricao: string;
}

// Gestao de usuarios pelo admin: consulta, criacao (simples ou completa, papel USER ou ADMIN),
// edicao e ativacao
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiUrl: string = 'http://localhost:8080/admin/usuarios';

  constructor(private http: HttpClient) {}

  // busca = parte do nome ou do email; idPlano = plano vigente da assinatura; demais filtros em FiltroUsuario
  findAll(
    page: number = 0,
    pageSize: number = 10,
    busca?: string,
    idPlano?: number | null,
    filtro: FiltroUsuario = {},
  ): Observable<PagedResponse<Usuario>> {
    const params = this.filtros(busca, idPlano, filtro).set('page', page).set('pageSize', pageSize);
    return this.http.get<PagedResponse<Usuario>>(this.apiUrl, { params });
  }

  // CSV com os mesmos filtros da listagem (UTF-8 com BOM e ";", sem CPF, telefone e endereco)
  exportarCsv(busca?: string, idPlano?: number | null, filtro: FiltroUsuario = {}): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exportacao`, { params: this.filtros(busca, idPlano, filtro), responseType: 'blob' });
  }

  // encerra as sessoes no Keycloak; os tokens ja emitidos deixam de valer na hora
  encerrarSessoes(id: number): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/${id}/sessoes/encerramento`, null);
  }

  // cadastro, mudancas de plano, pagamentos e acoes do admin (sem financas pessoais)
  linhaDoTempo(id: number): Observable<EventoLinhaDoTempo[]> {
    return this.http.get<EventoLinhaDoTempo[]>(`${this.apiUrl}/${id}/linha-do-tempo`);
  }

  private filtros(busca?: string, idPlano?: number | null, filtro: FiltroUsuario = {}): HttpParams {
    let params = new HttpParams();
    if (busca && busca.trim().length > 0) params = params.set('busca', busca.trim());
    if (idPlano != null) params = params.set('idPlano', idPlano);
    if (filtro.ativo != null) params = params.set('ativo', filtro.ativo);
    if (filtro.incompleto) params = params.set('incompleto', true);
    if (filtro.agendamento) params = params.set('agendamento', true);
    return params;
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

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EnderecoClienteResponse } from '../models/endereco-cliente.model';
import { Municipio } from '../models/municipio.model';

// Endereco do cadastro de CLIENTE com a base propria de CEPs (publico: o auto-registro e antes do
// login). Os contatos continuam no CepService.
@Injectable({ providedIn: 'root' })
export class EnderecoClienteService {
  private readonly apiUrl: string = 'http://localhost:8080/enderecos-cliente';

  constructor(private http: HttpClient) {}

  // base local -> ViaCEP (se ligado) -> modo manual
  consultar(cep: string): Observable<EnderecoClienteResponse> {
    return this.http.get<EnderecoClienteResponse>(`${this.apiUrl}/cep/${cep}`);
  }

  // municipios da UF (lista do IBGE) filtrados pelo nome
  municipios(uf: string, busca: string, limite: number = 20): Observable<Municipio[]> {
    const params = new HttpParams().set('uf', uf).set('busca', busca).set('limite', limite);
    return this.http.get<Municipio[]>(`${this.apiUrl}/municipios`, { params });
  }

  // bairros ou logradouros ja usados na base local do municipio
  sugestoes(idMunicipio: number, campo: 'bairro' | 'logradouro', busca: string): Observable<string[]> {
    const params = new HttpParams().set('idMunicipio', idMunicipio).set('campo', campo).set('busca', busca);
    return this.http.get<string[]>(`${this.apiUrl}/sugestoes`, { params });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CepResponse } from '../models/cep.model';

@Injectable({ providedIn: 'root' })
export class CepService {
  // Consulta pelo nosso back, que chama o ViaCEP e devolve o municipio com id
  private readonly apiUrl: string = 'http://localhost:8080/cep';

  constructor(private http: HttpClient) {}

  buscar(cep: string): Observable<CepResponse> {
    return this.http.get<CepResponse>(`${this.apiUrl}/${cep}`);
  }
}

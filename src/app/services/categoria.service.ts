import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Categoria } from '../models/categoria.model';

export interface PagedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

type CategoriaPayload = Omit<Categoria, 'tipo'> & {
    tipo?: Categoria['tipo'];
    idTipo?: number;
};

@Injectable({ providedIn: 'root' })
export class CategoriaService {
    private readonly apiUrl: string = 'http://localhost:8080/categorias';

    constructor(private http: HttpClient) {}

    private toPayload(categoria: Categoria): CategoriaPayload {
        return {
            ...categoria,
            idTipo: categoria.idTipo ?? categoria.tipo?.id,
        };
    }

    findAll(page: number = 0, pageSize: number = 10): Observable<PagedResponse<Categoria>> {
        const params = new HttpParams()
            .set('page', page)
            .set('pageSize', pageSize);

        return this.http.get<PagedResponse<Categoria>>(this.apiUrl, { params });
    }

    findById(id: number | string): Observable<Categoria> {
        return this.http.get<Categoria>(`${this.apiUrl}/${id}`);
    }

    create(categoria: Categoria): Observable<Categoria> {
        return this.http.post<Categoria>(this.apiUrl, this.toPayload(categoria));
    }

    update(id: number, categoria: Categoria): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, this.toPayload(categoria));
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}

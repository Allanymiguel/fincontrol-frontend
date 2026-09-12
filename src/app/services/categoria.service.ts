import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Categoria } from '../models/categoria.model';
import { Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class CategoriaService {
    private readonly apiUrl: string = 'http://localhost:8080/categorias';

    constructor(private http: HttpClient) {}

    findAll(): Observable<Categoria[]> {
        return this.http.get<Categoria[]>(this.apiUrl);
    }

    findById(id: number): Observable<Categoria> {
        const url = `${this.apiUrl}/${id}`;
        return this.http.get<Categoria>(url);
    }

    create(categoria: Categoria): Observable<Categoria> {
        return this.http.post<Categoria>(this.apiUrl, categoria);
    }

    update(id: number, categoria: Categoria): Observable<void> {
        const url = `${this.apiUrl}/${id}`;
        return this.http.put<void>(url, categoria);
    }

    delete(id: number): Observable<void> {
        const url = `${this.apiUrl}/${id}`;
        return this.http.delete<void>(url);
    }
}

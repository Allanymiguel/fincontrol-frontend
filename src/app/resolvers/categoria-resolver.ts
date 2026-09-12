import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { CategoriaService } from '../services/categoria.service';
import { Categoria } from '../models/categoria.model';

export const categoriaResolver: ResolveFn<Categoria> = (route, state) => {
  return inject(CategoriaService).findById(Number(route.paramMap.get('id')));
};

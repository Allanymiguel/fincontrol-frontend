import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Usuario } from '../models/usuario.model';
import { UsuarioService } from '../services/usuario.service';

export const usuarioResolver: ResolveFn<Usuario> = (route) => {
  return inject(UsuarioService).findById(Number(route.paramMap.get('id')));
};

import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { UsuarioResumo } from '../models/usuario-resumo.model';
import { UsuarioService } from '../services/usuario.service';

export const usuarioResumoResolver: ResolveFn<UsuarioResumo> = (route) => {
  return inject(UsuarioService).buscarResumo(Number(route.paramMap.get('id')));
};

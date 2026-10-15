import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Contato } from '../models/contato.model';
import { ContatoService } from '../services/contato.service';

export const contatoResolver: ResolveFn<Contato> = (route) => {
  return inject(ContatoService).findById(Number(route.paramMap.get('id')));
};

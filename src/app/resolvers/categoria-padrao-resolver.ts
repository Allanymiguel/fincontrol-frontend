import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { CategoriaPadrao } from '../models/categoria-padrao.model';
import { CategoriaPadraoService } from '../services/categoria-padrao.service';

export const categoriaPadraoResolver: ResolveFn<CategoriaPadrao> = (route) => {
  return inject(CategoriaPadraoService).findById(Number(route.paramMap.get('id')));
};

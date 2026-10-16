import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ParametroFiscal } from '../models/parametro-fiscal.model';
import { ParametroFiscalService } from '../services/parametro-fiscal.service';

export const parametroFiscalResolver: ResolveFn<ParametroFiscal> = (route) => {
  return inject(ParametroFiscalService).findById(Number(route.paramMap.get('id')));
};

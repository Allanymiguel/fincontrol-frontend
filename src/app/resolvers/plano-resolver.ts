import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Plano } from '../models/plano.model';
import { PlanoService } from '../services/plano.service';

export const planoResolver: ResolveFn<Plano> = (route) => {
  return inject(PlanoService).findById(Number(route.paramMap.get('id')));
};

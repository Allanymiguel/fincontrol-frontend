import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Cupom } from '../models/cupom.model';
import { CupomService } from '../services/cupom.service';

export const cupomResolver: ResolveFn<Cupom> = (route) => {
  return inject(CupomService).findById(Number(route.paramMap.get('id')));
};

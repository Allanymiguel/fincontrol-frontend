import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Assinatura } from '../models/assinatura.model';
import { AssinaturaService } from '../services/assinatura.service';

export const assinaturaResolver: ResolveFn<Assinatura> = (route) => {
  return inject(AssinaturaService).findById(Number(route.paramMap.get('id')));
};

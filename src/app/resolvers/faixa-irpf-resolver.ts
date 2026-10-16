import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { FaixaIrpf } from '../models/faixa-irpf.model';
import { FaixaIrpfService } from '../services/faixa-irpf.service';

export const faixaIrpfResolver: ResolveFn<FaixaIrpf> = (route) => {
  return inject(FaixaIrpfService).findById(Number(route.paramMap.get('id')));
};

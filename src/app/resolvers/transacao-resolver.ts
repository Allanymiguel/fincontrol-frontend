import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { TransacaoService } from '../services/transacao.service';
import { Transacao } from '../models/transacao.model';

export const transacaoResolver: ResolveFn<Transacao> = (route, state) => {
  return inject(TransacaoService).findById(Number(route.paramMap.get('id')));
};

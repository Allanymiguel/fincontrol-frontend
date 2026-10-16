import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AUTH_HABILITADA } from './auth-config';

// Os guards so melhoram a navegacao: quem protege os dados de verdade e o @RolesAllowed do back.

// telas do sistema: exige login; depois do login volta para a tela pedida
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (!AUTH_HABILITADA || auth.logado()) return true;

  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

// area administrativa: exige a role ADMIN
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!AUTH_HABILITADA || auth.isAdmin()) return true;
  if (!auth.logado()) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });

  // logado sem ser admin: volta para a area operacional
  return router.createUrlTree(['/']);
};

// login e cadastro: quem ja esta logado vai direto para o sistema
export const visitanteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!AUTH_HABILITADA || !auth.logado()) return true;

  return inject(Router).createUrlTree(['/']);
};

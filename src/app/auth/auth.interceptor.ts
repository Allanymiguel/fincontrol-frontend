import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AUTH_HABILITADA } from './auth-config';

// endpoints de login/cadastro nao levam token (e um token vencido nao pode atrapalhar o login)
const ROTAS_PUBLICAS = /\/auth\/(login|refresh|registro|logout)$/;

// Envia o access token em toda chamada a API. Se ele estiver vencendo, renova antes;
// se o back responder 401, renova uma vez e repete. Sem renovacao possivel: volta para o login.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();

  if (!AUTH_HABILITADA || !token || ROTAS_PUBLICAS.test(req.url)) {
    return next(req);
  }

  const enviarCom = (accessToken: string) =>
    next(req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }));

  const renovarEEnviar = () =>
    auth.renovar().pipe(
      catchError((erro) => {
        auth.encerrarSessaoExpirada();
        return throwError(() => erro);
      }),
      switchMap(enviarCom),
    );

  if (auth.accessTokenPertoDeVencer()) {
    return renovarEEnviar();
  }

  return enviarCom(token).pipe(
    catchError((erro) =>
      erro instanceof HttpErrorResponse && erro.status === 401 ? renovarEEnviar() : throwError(() => erro),
    ),
  );
};

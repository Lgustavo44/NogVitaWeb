import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenRefresher } from '../auth/token-refresher';
import { apiUrl } from './api-url';

/** Endpoints de `/auth` que não usam o token (e cujo 401 não deve disparar renovação). */
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/register/',
  '/auth/email-confirmation/',
  '/auth/password-reset/',
  '/auth/invitations/',
];

/**
 * Coloca o `Bearer` nas chamadas à API. Se o token estiver vencendo, renova antes;
 * se a API responder 401, renova uma vez e repete a requisição.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!needsToken(request)) {
    return next(request);
  }
  const refresher = inject(TokenRefresher);

  return refresher.validAccessToken().pipe(
    switchMap((token) => next(withBearer(request, token))),
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      return refresher.refresh().pipe(switchMap((token) => next(withBearer(request, token))));
    }),
  );
};

function needsToken(request: HttpRequest<unknown>): boolean {
  const base = apiUrl('');
  if (!request.url.startsWith(base)) {
    return false;
  }
  const path = request.url.slice(base.length);
  return !PUBLIC_AUTH_PATHS.some((publicPath) => path.startsWith(publicPath));
}

function withBearer(request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
}

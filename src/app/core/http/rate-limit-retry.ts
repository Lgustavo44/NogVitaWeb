import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';

/** Quantas vezes repetimos um GET recusado por excesso de requisições. */
export const RATE_LIMIT_RETRIES = 2;
/** Espera quando a API não manda `Retry-After`: 1 s, depois 2 s. */
export const RATE_LIMIT_BASE_DELAY_MS = 1000;
/** Teto da espera, mesmo que o `Retry-After` peça mais: a pessoa está olhando para a tela. */
export const RATE_LIMIT_MAX_DELAY_MS = 5000;

/**
 * 429 é passageiro: em vez de mostrar erro (ou mandar para "servidor indisponível"),
 * repete o GET algumas vezes. Só GET/HEAD, porque repetir um POST poderia duplicar a ação.
 */
export const rateLimitRetryInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next(request);
  }
  return next(request).pipe(
    retry({
      count: RATE_LIMIT_RETRIES,
      delay: (error: unknown, attempt) =>
        error instanceof HttpErrorResponse && error.status === 429
          ? timer(retryDelay(error, attempt))
          : throwError(() => error),
    }),
  );
};

function retryDelay(error: HttpErrorResponse, attempt: number): number {
  const seconds = Number(error.headers.get('Retry-After'));
  const requested =
    Number.isFinite(seconds) && seconds > 0
      ? seconds * 1000
      : RATE_LIMIT_BASE_DELAY_MS * 2 ** (attempt - 1);
  return Math.min(requested, RATE_LIMIT_MAX_DELAY_MS);
}

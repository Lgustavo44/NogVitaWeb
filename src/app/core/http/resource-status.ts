import { HttpErrorResponse } from '@angular/common/http';

/**
 * Na API, alguns 404 são estados normais, não erros:
 * "Você não está em acompanhamento." e "Você não tem um plano ativo.".
 */
export function isNotFound(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 404;
}

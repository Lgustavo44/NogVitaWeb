import { HttpErrorResponse } from '@angular/common/http';
import { FieldTree, ValidationError } from '@angular/forms/signals';

/** Formato de erro da API (RFC 9457). O 401 e o 403 de token ou papel vêm sem corpo. */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
}

export interface ApiError {
  status: number;
  /** Mensagem pronta para mostrar (a API já manda em português). */
  message: string;
  /** Erros por campo, com as chaves em minúsculas (a API manda em PascalCase). */
  fieldErrors: Record<string, string[]>;
  /** Código para o suporte; vem nos erros 409, 422 e 500. */
  traceId?: string;
}

const FALLBACK_MESSAGES: Record<number, string> = {
  0: 'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para fazer isso.',
  404: 'Não encontramos o que você procurou.',
  429: 'Muitas tentativas. Espere um minuto e tente de novo.',
  503: 'O serviço está indisponível no momento. Tente de novo em instantes.',
};
const GENERIC_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente em instantes.';
const FIELD_ERRORS_MESSAGE = 'Confira os campos destacados.';

export function toApiError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return { status: 0, message: GENERIC_MESSAGE, fieldErrors: {} };
  }

  const problem = isProblemDetails(error.error) ? error.error : undefined;
  const fieldErrors = normalizeKeys(problem?.errors);
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  return {
    status: error.status,
    message: messageFor(error.status, problem, hasFieldErrors),
    fieldErrors,
    traceId: problem?.traceId,
  };
}

function messageFor(
  status: number,
  problem: ProblemDetails | undefined,
  hasFieldErrors: boolean,
): string {
  // O título de validação vem em inglês ("One or more validation errors occurred.").
  if (hasFieldErrors) {
    return FIELD_ERRORS_MESSAGE;
  }
  // O 500 nunca traz detalhe útil e, quando escapa do tratador da API, vem em inglês.
  if (status === 500) {
    return GENERIC_MESSAGE;
  }
  return problem?.title ?? FALLBACK_MESSAGES[status] ?? GENERIC_MESSAGE;
}

/**
 * Mensagem única para mostrar num alerta: as mensagens dos campos, quando houver
 * (ex.: "A quantidade deve ser maior que zero."), senão a mensagem geral.
 */
export function errorSummary(error: unknown): string {
  const apiError = toApiError(error);
  const fieldMessages = Object.values(apiError.fieldErrors).flat();
  return fieldMessages.length > 0 ? fieldMessages.join(' ') : apiError.message;
}

/**
 * Converte os erros por campo da API em erros do Signal Forms, para aparecerem embaixo de cada campo.
 * Uso no `action` do formulário: `return toFieldErrors(apiError, { email: f.email })`.
 */
export function toFieldErrors(
  error: ApiError,
  fields: Record<string, FieldTree<unknown>>,
): ValidationError.WithOptionalFieldTree[] {
  return Object.entries(fields).flatMap(([name, fieldTree]) =>
    (error.fieldErrors[name.toLowerCase()] ?? []).map((message) => ({
      kind: 'server',
      message,
      fieldTree,
    })),
  );
}

function isProblemDetails(body: unknown): body is ProblemDetails {
  return typeof body === 'object' && body !== null && ('title' in body || 'errors' in body);
}

function normalizeKeys(errors: Record<string, string[]> | undefined): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(errors ?? {}).map(([key, messages]) => [key.toLowerCase(), messages]),
  );
}

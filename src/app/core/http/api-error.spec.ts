import { HttpErrorResponse } from '@angular/common/http';
import { toApiError } from './api-error';

describe('toApiError', () => {
  it('normaliza as chaves do 400 para minúsculas e troca o título em inglês', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        title: 'One or more validation errors occurred.',
        status: 400,
        errors: { Email: ['O e-mail informado não é válido.'] },
      },
    });

    const result = toApiError(error);

    expect(result.status).toBe(400);
    expect(result.message).toBe('Confira os campos destacados.');
    expect(result.fieldErrors).toEqual({ email: ['O e-mail informado não é válido.'] });
  });

  it('usa o título da API quando não há erros por campo', () => {
    const error = new HttpErrorResponse({
      status: 401,
      error: { title: 'E-mail ou senha inválidos.', status: 401 },
    });

    expect(toApiError(error).message).toBe('E-mail ou senha inválidos.');
  });

  it('usa a mensagem padrão do status quando o corpo vem vazio (401 e 403 de token)', () => {
    const error = new HttpErrorResponse({ status: 403, error: null });

    expect(toApiError(error).message).toBe('Você não tem permissão para fazer isso.');
  });

  it('trata a falta de conexão (status 0)', () => {
    const error = new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') });

    expect(toApiError(error).message).toContain('Verifique sua conexão');
  });

  it('no 500 mostra a mensagem em português, mesmo se a API mandar em inglês, e guarda o traceId', () => {
    const error = new HttpErrorResponse({
      status: 500,
      error: {
        title: 'An error occurred while processing your request.',
        status: 500,
        traceId: '00-abc-01',
      },
    });

    const result = toApiError(error);

    expect(result.message).toBe('Ocorreu um erro inesperado. Tente novamente em instantes.');
    expect(result.traceId).toBe('00-abc-01');
  });

  it('não quebra com erros que não são HTTP', () => {
    expect(toApiError(new Error('falhou')).status).toBe(0);
  });
});

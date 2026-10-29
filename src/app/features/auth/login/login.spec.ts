import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Session } from '../../../core/auth/session';
import { Login } from './login';

const LOGIN_URL = '/api/v1/auth/login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Login);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => controller.verify());

  async function fillAndSubmit(email: string, password: string): Promise<void> {
    type(element.querySelector('input[type="email"]')!, email);
    type(element.querySelector('input[autocomplete="current-password"]')!, password);
    submit();
    await settle();
  }

  /** A ação do formulário é assíncrona: espera as promessas pendentes e a tela atualizar. */
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  function type(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submit(): void {
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  it('não chama a API e mostra os erros quando os campos estão vazios', async () => {
    submit();
    await fixture.whenStable();

    controller.expectNone(LOGIN_URL);
    expect(element.textContent).toContain('Informe seu e-mail.');
    expect(element.textContent).toContain('Informe sua senha.');
  });

  it('entra e vai para o início quando a API aceita', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await fillAndSubmit('ana@exemplo.com', 'uma-senha-qualquer');
    const request = controller.expectOne(LOGIN_URL);
    expect(request.request.body).toEqual({
      email: 'ana@exemplo.com',
      password: 'uma-senha-qualquer',
    });
    request.flush({
      accessToken: 'a',
      accessTokenExpiresAtUtc: '2026-10-29T12:15:00Z',
      refreshToken: 'r',
      refreshTokenExpiresAtUtc: '2026-11-05T12:00:00Z',
    });
    await settle();

    expect(TestBed.inject(Session).isAuthenticated()).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/inicio');
  });

  it('mostra a mensagem da API no 401', async () => {
    await fillAndSubmit('ana@exemplo.com', 'senha-errada');
    controller
      .expectOne(LOGIN_URL)
      .flush(
        { title: 'E-mail ou senha inválidos.', status: 401 },
        { status: 401, statusText: 'Unauthorized' },
      );
    await settle();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'E-mail ou senha inválidos.',
    );
  });

  it('no 403 oferece o reenvio do link e reenvia para o e-mail digitado', async () => {
    await fillAndSubmit('ana@exemplo.com', 'senha-certa');
    controller
      .expectOne(LOGIN_URL)
      .flush(
        { title: 'Confirme seu e-mail antes de entrar.', status: 403 },
        { status: 403, statusText: 'Forbidden' },
      );
    await settle();

    expect(element.textContent).toContain('Confirmação pendente');

    const resendButton = [...element.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Reenviar link'),
    )!;
    resendButton.click();
    const resend = controller.expectOne('/api/v1/auth/email-confirmation/resend');
    expect(resend.request.body).toEqual({ email: 'ana@exemplo.com' });
    resend.flush({ message: 'ok' }, { status: 202, statusText: 'Accepted' });
    await settle();

    expect(element.textContent).toContain('Enviamos um novo link.');
  });

  it('mostra embaixo do campo o erro de validação que vem da API', async () => {
    await fillAndSubmit('ana@exemplo.com', 'x');
    controller.expectOne(LOGIN_URL).flush(
      {
        title: 'One or more validation errors occurred.',
        status: 400,
        errors: { Password: ['A senha é obrigatória.'] },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    const password = element.querySelector('input[autocomplete="current-password"]')!;
    const error = element.querySelector(`#${password.getAttribute('aria-describedby')}`);
    expect(error?.textContent).toContain('A senha é obrigatória.');
  });
});

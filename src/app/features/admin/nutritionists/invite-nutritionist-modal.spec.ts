import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InviteNutritionistModal } from './invite-nutritionist-modal';

describe('InviteNutritionistModal', () => {
  let fixture: ComponentFixture<InviteNutritionistModal>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  function type(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function fill(cpf: string): Promise<void> {
    const inputs = element.querySelectorAll<HTMLInputElement>('input');
    inputs[0].value = 'Nutri Exemplo';
    inputs[0].dispatchEvent(new Event('input'));
    type('input[type="email"]', 'nutri@exemplo.com');
    type('input[inputmode="numeric"]', cpf);
    inputs[3].value = '12345';
    inputs[3].dispatchEvent(new Event('input'));
    await settle();
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(InviteNutritionistModal);
    element = fixture.nativeElement;
    await settle();
  });

  afterEach(() => controller.verify());

  it('não envia com CPF inválido', async () => {
    await fill('111.111.111-11');

    controller.expectNone('/api/v1/admin/nutritionists');
    expect(element.textContent).toContain('Informe um CPF válido.');
  });

  it('envia com a máscara do CPF e a região padrão; se o e-mail falhar, oferece reenviar', async () => {
    const invited = vi.fn();
    fixture.componentInstance.invited.subscribe(invited);
    await fill('52998224725');

    const request = controller.expectOne('/api/v1/admin/nutritionists');
    expect(request.request.body).toEqual({
      name: 'Nutri Exemplo',
      email: 'nutri@exemplo.com',
      cpf: '529.982.247-25',
      crnRegion: 3,
      crnNumber: '12345',
    });
    request.flush(
      { userId: 'u9', invitationEmailSent: false },
      { status: 201, statusText: 'Created' },
    );
    await settle();

    expect(invited).toHaveBeenCalledWith({ emailSent: false });
    expect(element.textContent).toContain('o e-mail não foi enviado');
    expect(element.textContent).toContain('Reenviar convite');
  });

  it('no 409 mostra a mensagem da API', async () => {
    await fill('52998224725');
    controller
      .expectOne('/api/v1/admin/nutritionists')
      .flush(
        { title: 'Não foi possível pré-cadastrar o nutricionista com esses dados.' },
        { status: 409, statusText: 'Conflict' },
      );
    await settle();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Não foi possível pré-cadastrar',
    );
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { NutritionistRequestsPage } from './nutritionist-requests';

const URL = '/api/v1/nutritionists/me/requests';
const ITEMS = [
  {
    id: 'q1',
    patientId: 'p1',
    patientName: 'Daniela Rocha',
    status: 'Pending',
    message: 'Olá!',
    createdAt: '2026-10-28T12:00:00Z',
    respondedAtUtc: null,
  },
  {
    id: 'q2',
    patientId: 'p2',
    patientName: 'Bruno Lima',
    status: 'Pending',
    message: null,
    createdAt: '2026-10-27T12:00:00Z',
    respondedAtUtc: null,
  },
  {
    id: 'q3',
    patientId: 'p3',
    patientName: 'Ana Souza',
    status: 'Accepted',
    message: null,
    createdAt: '2026-10-01T12:00:00Z',
    respondedAtUtc: '2026-10-02T12:00:00Z',
  },
];

describe('NutritionistRequestsPage', () => {
  let fixture: ComponentFixture<NutritionistRequestsPage>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  const buttons = (text: string) =>
    [...element.querySelectorAll('button')].filter((b) => b.textContent?.includes(text));
  const reloadWith = (items: unknown[]) =>
    controller
      .expectOne((req) => req.url === URL)
      .flush({ items, page: 1, pageSize: 100, totalItems: items.length });

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NutritionistRequestsPage);
    element = fixture.nativeElement;
    TestBed.tick();
    reloadWith(ITEMS);
    await settle();
  });

  afterEach(() => controller.verify());

  it('começa nas pendentes, com a contagem visível no filtro selecionado', () => {
    const pending = buttons('Pendentes')[0];

    expect(pending.getAttribute('aria-pressed')).toBe('true');
    expect(pending.textContent).toContain('2');
    expect(element.querySelectorAll('article')).toHaveLength(2);
  });

  it('aceita na hora e recarrega a lista', async () => {
    const toaster = TestBed.inject(Toaster);
    buttons('Aceitar')[0].click();
    await settle();

    controller.expectOne(`${URL}/q1/accept`).flush(null, { status: 204, statusText: 'No Content' });
    await settle();
    reloadWith(ITEMS.slice(1));
    await settle();

    expect(toaster.toasts()[0].message).toBe('Daniela Rocha agora está entre os seus pacientes.');
    expect(element.querySelectorAll('article')).toHaveLength(1);
  });

  it('recusa só depois de confirmar no modal', async () => {
    buttons('Recusar')[0].click();
    await settle();
    controller.expectNone(`${URL}/q1/reject`);

    const dialog = element.querySelector('[role="alertdialog"]')!;
    expect(dialog.textContent).toContain('Daniela Rocha');
    [...dialog.querySelectorAll('button')]
      .find((b) => b.textContent?.trim() === 'Recusar')!
      .click();
    await settle();

    controller.expectOne(`${URL}/q1/reject`).flush(null, { status: 204, statusText: 'No Content' });
    await settle();
    reloadWith(ITEMS.slice(1));
    await settle();
    expect(element.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('se o paciente cancelou antes (409), mostra a mensagem da API e recarrega', async () => {
    buttons('Aceitar')[0].click();
    await settle();
    controller
      .expectOne(`${URL}/q1/accept`)
      .flush(
        { title: 'O paciente cancelou esta solicitação.' },
        { status: 409, statusText: 'Conflict' },
      );
    await settle();
    reloadWith(ITEMS.slice(1));
    await settle();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'cancelou esta solicitação',
    );
  });
});

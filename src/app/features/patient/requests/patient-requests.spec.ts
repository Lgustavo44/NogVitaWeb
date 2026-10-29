import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PatientRequestsPage } from './patient-requests';

const URL = '/api/v1/patients/me/nutritionist-requests';

const ITEMS = [
  {
    id: 'p1',
    nutritionistId: 'n1',
    nutritionistName: 'Carla Mendes',
    status: 'Pending',
    message: 'Olá!',
    createdAt: '2026-10-28T12:00:00Z',
    respondedAtUtc: null,
  },
  {
    id: 'a1',
    nutritionistId: 'n2',
    nutritionistName: 'Bruno Lima',
    status: 'Accepted',
    message: null,
    createdAt: '2026-09-01T12:00:00Z',
    respondedAtUtc: '2026-09-02T12:00:00Z',
  },
  {
    id: 'c1',
    nutritionistId: 'n3',
    nutritionistName: 'Dora Reis',
    status: 'Cancelled',
    message: null,
    createdAt: '2026-08-01T12:00:00Z',
    respondedAtUtc: null,
  },
];

describe('PatientRequestsPage', () => {
  let fixture: ComponentFixture<PatientRequestsPage>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  function buttonWith(text: string): HTMLButtonElement {
    return [...element.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PatientRequestsPage);
    element = fixture.nativeElement;
    TestBed.tick();
    const list = controller.expectOne((req) => req.url === URL);
    expect(list.request.params.get('pageSize')).toBe('100');
    expect(list.request.params.has('status')).toBe(false);
    list.flush({ items: ITEMS, page: 1, pageSize: 100, totalItems: 3 });
    await settle();
  });

  afterEach(() => controller.verify());

  it('mostra as contagens nos filtros e separa pendente do histórico', () => {
    expect(buttonWith('Todas').textContent).toContain('3');
    expect(buttonWith('Pendentes').textContent).toContain('1');
    expect(buttonWith('Recusadas').textContent).toContain('0');
    expect(element.querySelector('article')?.textContent).toContain('Carla Mendes');
    expect(element.textContent).toContain('Histórico de solicitações');
  });

  it('filtra na tela, sem nova chamada à API', async () => {
    buttonWith('Aceitas').click();
    await settle();

    controller.expectNone((req) => req.url === URL);
    expect(buttonWith('Aceitas').getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelector('article')).toBeNull();
    expect(element.querySelector('table')?.textContent).toContain('Bruno Lima');
    expect(element.querySelector('table')?.textContent).not.toContain('Dora Reis');
  });

  it('cancela depois de confirmar e recarrega a lista', async () => {
    buttonWith('Cancelar solicitação').click();
    await settle();
    expect(element.querySelector('[role="alertdialog"]')?.textContent).toContain('Carla Mendes');

    buttonWith('Sim, cancelar').click();
    await settle();
    controller.expectOne(`${URL}/p1/cancel`).flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    controller
      .expectOne((req) => req.url === URL)
      .flush({ items: ITEMS.slice(1), page: 1, pageSize: 100, totalItems: 2 });
    await settle();
    expect(element.querySelector('[role="alertdialog"]')).toBeNull();
    expect(buttonWith('Pendentes').textContent).toContain('0');
  });
});

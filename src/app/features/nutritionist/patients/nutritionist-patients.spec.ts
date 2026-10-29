import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NutritionistPatientsPage } from './nutritionist-patients';

const URL = '/api/v1/nutritionists/me/patients';
const patient = (n: number) => ({
  patientId: `p${n}`,
  name: `Paciente ${n}`,
  goal: 'WeightLoss',
  startedAtUtc: '2026-08-02T12:00:00Z',
});

describe('NutritionistPatientsPage', () => {
  let fixture: ComponentFixture<NutritionistPatientsPage>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NutritionistPatientsPage);
    element = fixture.nativeElement;
    TestBed.tick();
    // 23 pacientes, sem totalPages: a paginação precisa calcular 3 páginas pelo totalItems.
    controller
      .expectOne((req) => req.url === URL)
      .flush({
        items: Array.from({ length: 10 }, (_, i) => patient(i + 1)),
        page: 1,
        pageSize: 10,
        totalItems: 23,
      });
    await settle();
  });

  afterEach(() => {
    controller.verify();
    vi.useRealTimers();
  });

  it('calcula as páginas pelo totalItems', () => {
    expect(element.textContent).toContain('Página 1 de 3');
    expect(element.querySelector('a[href="/nutricionista/pacientes/p1"]')).not.toBeNull();
  });

  it('busca só depois de a pessoa parar de digitar, voltando para a página 1', async () => {
    const input = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    for (const value of ['A', 'An', 'Ana']) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await settle();
    }
    controller.expectNone((req) => req.url === URL);

    vi.advanceTimersByTime(400);
    await settle();

    const request = controller.expectOne((req) => req.url === URL);
    expect(request.request.params.get('search')).toBe('Ana');
    expect(request.request.params.get('page')).toBe('1');
    request.flush({ items: [patient(1)], page: 1, pageSize: 10, totalItems: 1 });
  });
});

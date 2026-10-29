import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { PatientPlans } from './patient-plans';

describe('PatientPlans', () => {
  let fixture: ComponentFixture<PatientPlans>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PatientPlans);
    fixture.componentRef.setInput('patientId', 'p1');
    element = fixture.nativeElement;
    await settle();
    controller
      .expectOne((req) => req.url === '/api/v1/nutritionists/me/patients/p1/nutrition-plans')
      .flush({ items: [], page: 1, pageSize: 50, totalItems: 0 });
    await settle();
  });

  afterEach(() => controller.verify());

  it('cria o rascunho e abre o editor', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    expect(element.textContent).toContain('Nenhum plano ainda');

    [...element.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Novo plano'))!
      .click();
    await settle();
    const name = element.querySelector<HTMLInputElement>('input[placeholder^="Ex.: Plano"]')!;
    name.value = '  Plano de teste  ';
    name.dispatchEvent(new Event('input'));
    await settle();
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle();

    const request = controller.expectOne('/api/v1/nutritionists/me/nutrition-plans');
    expect(request.request.body).toEqual(
      expect.objectContaining({ patientId: 'p1', name: 'Plano de teste', endDate: null }),
    );
    request.flush({ id: 'pl9' }, { status: 201, statusText: 'Created' });
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/nutricionista/planos', 'pl9']);
  });
});

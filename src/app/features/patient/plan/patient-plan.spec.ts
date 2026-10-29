import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { PatientPlanPage } from './patient-plan';

registerLocaleData(localePt);

const BASE = '/api/v1/patients/me/nutrition-plans';
const total = (value: number) => ({ value, isComplete: true });
const totals = {
  energyKcal: total(0),
  protein: total(0),
  carbohydrate: total(0),
  fat: total(0),
  fiber: total(0),
  sodiumMg: total(0),
};
const plan = (id: string, status: string, name: string) => ({
  id,
  patientId: 'p1',
  patientName: 'Paciente Exemplo',
  nutritionistId: 'n1',
  nutritionistName: 'Nutri Exemplo',
  name,
  description: null,
  startDate: '2026-10-15',
  endDate: null,
  status,
  createdAt: '2026-10-14T18:00:00Z',
  targetEnergyKcal: null,
  targetProteinGrams: null,
  targetCarbohydrateGrams: null,
  targetFatGrams: null,
});

describe('PatientPlanPage', () => {
  let fixture: ComponentFixture<PatientPlanPage>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PatientPlanPage);
    element = fixture.nativeElement;
    await settle();
  });

  afterEach(() => controller.verify());

  function flushList(): void {
    controller
      .expectOne((req) => req.url === BASE)
      .flush({
        items: [plan('pl1', 'Active', 'Plano atual'), plan('pl0', 'Finished', 'Plano antigo')],
        page: 1,
        pageSize: 50,
        totalItems: 2,
      });
  }

  it('sem plano ativo (404) mostra o estado vazio, não um erro, e lista os anteriores', async () => {
    controller
      .expectOne(`${BASE}/current`)
      .flush({ title: 'Você não tem um plano ativo.' }, { status: 404, statusText: 'Not Found' });
    flushList();
    await settle();

    expect(element.textContent).toContain('Você ainda não tem um plano ativo');
    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(element.textContent).toContain('Plano antigo');
    expect(element.textContent).not.toContain('Plano atual');
  });

  describe('com plano ativo', () => {
    beforeEach(async () => {
      controller
        .expectOne(`${BASE}/current`)
        .flush({ plan: plan('pl1', 'Active', 'Plano atual'), meals: [], dailyTotals: totals });
      flushList();
      await settle();
    });

    function sendEmail(): void {
      [...element.querySelectorAll('button')]
        .find((b) => b.textContent?.includes('Receber por e-mail'))!
        .click();
    }

    it('envia o PDF por e-mail e confirma', async () => {
      const show = vi.spyOn(TestBed.inject(Toaster), 'show');
      sendEmail();
      await settle();
      const request = controller.expectOne(`${BASE}/pl1/pdf/email`);
      expect(request.request.method).toBe('POST');
      request.flush(null, { status: 204, statusText: 'No Content' });
      await settle();

      expect(show).toHaveBeenCalledWith('Enviamos o PDF para o e-mail da sua conta.');
    });

    it('no 429 explica o limite e sugere baixar', async () => {
      sendEmail();
      await settle();
      controller
        .expectOne(`${BASE}/pl1/pdf/email`)
        .flush({ title: 'Muitas tentativas.' }, { status: 429, statusText: 'Too Many Requests' });
      await settle();

      expect(element.textContent).toContain('3 vezes na última hora');
    });

    it('no 503 sugere baixar o PDF', async () => {
      sendEmail();
      await settle();
      controller
        .expectOne(`${BASE}/pl1/pdf/email`)
        .flush({ title: 'Falha.' }, { status: 503, statusText: 'Service Unavailable' });
      await settle();

      expect(element.querySelector('[role="alert"]')?.textContent).toContain('Baixe o PDF');
    });
  });
});

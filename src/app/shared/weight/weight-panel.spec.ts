import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Component, LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Toaster } from '../ui/toast/toaster';
import { daysAgoIsoDate, localIsoDate } from '../util/dates';
import { WeightPanel } from './weight-panel';

const URL = '/api/v1/patients/me/weight-records';

@Component({
  imports: [WeightPanel],
  template: `
    <app-weight-panel
      recordsPath="/patients/me/weight-records"
      deletePath="/patients/me/weight-records"
      perspective="patient"
    />
  `,
})
class Host {}

const RECORDS = [
  {
    id: 'w1',
    recordedOn: daysAgoIsoDate(1),
    weightKg: 72.1,
    notes: null,
    recordedByPatient: true,
    recordedByName: 'Ana',
  },
  {
    id: 'w2',
    recordedOn: daysAgoIsoDate(10),
    weightKg: 73.5,
    notes: null,
    recordedByPatient: false,
    recordedByName: 'Carla Mendes',
  },
];

registerLocaleData(localePt);

describe('WeightPanel', () => {
  let fixture: ComponentFixture<Host>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  const list = () => controller.expectOne((req) => req.url === URL && req.method === 'GET');
  const buttonWith = (text: string, root: ParentNode = element) =>
    [...root.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!;

  async function openFormAndSubmit(weight: string): Promise<void> {
    buttonWith('Registrar peso').click();
    await settle();
    const input = element.querySelector<HTMLInputElement>('input[type="number"]')!;
    input.value = weight;
    input.dispatchEvent(new Event('input'));
    await settle();
    element
      .querySelector('form#form-peso')!
      .dispatchEvent(new Event('submit', { cancelable: true }));
    await settle();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        // Como no app.config: números e datas no formato brasileiro.
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Host);
    element = fixture.nativeElement;
    TestBed.tick();
    const request = list();
    // Período padrão: últimos 3 meses.
    expect(request.request.params.get('from')).toBe(daysAgoIsoDate(90));
    request.flush({ items: RECORDS, page: 1, pageSize: 100, totalItems: 2 });
    await settle();
  });

  afterEach(() => controller.verify());

  it('mostra o resumo do período (mais recente e variação desde o primeiro)', () => {
    expect(element.textContent).toContain('72,1 kg');
    expect(element.textContent).toContain('−1,4 kg');
  });

  it('só oferece apagar o que a própria pessoa registrou', () => {
    const deleteButtons = element.querySelectorAll('table button[aria-label^="Apagar"]');

    expect(deleteButtons).toHaveLength(1);
  });

  it('registra com a data de hoje (local) e avisa quando foi atualização (200)', async () => {
    const toaster = TestBed.inject(Toaster);
    await openFormAndSubmit('71.8');

    const post = controller.expectOne((req) => req.url === URL && req.method === 'POST');
    expect(post.request.body).toEqual({ weightKg: 71.8, recordedOn: localIsoDate(), notes: null });
    post.flush({}, { status: 200, statusText: 'OK' });
    await settle();
    list().flush({ items: RECORDS, page: 1, pageSize: 100, totalItems: 2 });
    await settle();

    expect(toaster.toasts()[0].message).toBe('Registro do dia atualizado.');
  });

  it('no 409 (registro do dia feito pelo nutricionista), mostra a mensagem no modal', async () => {
    await openFormAndSubmit('71.8');
    controller
      .expectOne((req) => req.url === URL && req.method === 'POST')
      .flush(
        { title: 'Já existe um registro do nutricionista nesta data.' },
        { status: 409, statusText: 'Conflict' },
      );
    await settle();

    expect(element.querySelector('[role="dialog"]')?.textContent).toContain(
      'registro do nutricionista nesta data',
    );
  });

  it('troca o período e busca de novo (Todo o histórico vai sem "from")', async () => {
    const select = element.querySelector('select')!;
    select.value = '0';
    select.dispatchEvent(new Event('change'));
    await settle();

    const request = list();
    expect(request.request.params.has('from')).toBe(false);
    request.flush({ items: RECORDS, page: 1, pageSize: 100, totalItems: 2 });
  });
});

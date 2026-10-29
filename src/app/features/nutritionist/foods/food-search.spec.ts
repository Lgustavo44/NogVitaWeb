import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FoodSearchPage } from './food-search';

registerLocaleData(localePt);

const URL = '/api/v1/foods';
const ARROZ = {
  id: 'f1',
  name: 'Arroz, integral, cozido',
  brand: null,
  barcode: null,
  category: 'Cereais e derivados',
  source: 'Taco',
  sourceReference: '3',
  isActive: true,
  energyKcalPer100g: '124',
  proteinPer100g: 2.6,
  carbohydratePer100g: 25.8,
  fatPer100g: 1,
  fiberPer100g: 2.7,
  sodiumMgPer100g: null,
  attribution: 'TACO 4ª edição, NEPA/UNICAMP.',
  isComplete: false,
};

describe('FoodSearchPage', () => {
  let fixture: ComponentFixture<FoodSearchPage>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  async function type(value: string): Promise<void> {
    const input = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await settle();
    vi.advanceTimersByTime(400);
    await settle();
  }

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FoodSearchPage);
    element = fixture.nativeElement;
    await settle();
  });

  afterEach(() => {
    controller.verify();
    vi.useRealTimers();
  });

  it('não busca com menos de 2 letras', async () => {
    await type('a');

    controller.expectNone((req) => req.url === URL);
    expect(element.textContent).toContain('Busque um alimento');
  });

  it('busca pelo termo e mostra "—" para nutriente sem informação, com a atribuição da fonte', async () => {
    await type('arroz');

    const request = controller.expectOne((req) => req.url === URL);
    expect(request.request.params.get('search')).toBe('arroz');
    expect(request.request.params.has('source')).toBe(false);
    request.flush({ items: [ARROZ], page: 1, pageSize: 15, totalItems: 1 });
    await settle();

    const row = element.querySelector('tbody tr')!;
    expect(row.textContent).toContain('124 kcal');
    expect(row.textContent).toContain('25,8 g');
    expect(row.textContent).toContain('Dados incompletos');
    expect(
      element.querySelector('[aria-label="Fonte dos dados nutricionais"]')?.textContent,
    ).toContain('TACO 4ª edição');
  });

  it('filtra pela fonte, voltando para a página 1', async () => {
    await type('arroz');
    controller
      .expectOne((req) => req.url === URL)
      .flush({ items: [ARROZ], page: 1, pageSize: 15, totalItems: 1 });
    await settle();

    [...element.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Open Food Facts'))!
      .click();
    await settle();

    const request = controller.expectOne((req) => req.url === URL);
    expect(request.request.params.get('source')).toBe('OpenFoodFacts');
    expect(request.request.params.get('page')).toBe('1');
    request.flush({ items: [], page: 1, pageSize: 15, totalItems: 0 });
  });
});

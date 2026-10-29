import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { PlanEditorPage } from './plan-editor';

registerLocaleData(localePt);

const URL = '/api/v1/nutritionists/me/nutrition-plans/pl1';
const total = (value: number) => ({ value, isComplete: true });
const totals = (kcal: number) => ({
  energyKcal: total(kcal),
  protein: total(0),
  carbohydrate: total(0),
  fat: total(0),
  fiber: total(0),
  sodiumMg: total(0),
});
const meal = (id: string, order: number, name: string, outsideRoutine: boolean | null = false) => ({
  id,
  name,
  notes: null,
  order,
  suggestedTime: '07:00:00',
  outsideRoutine,
  foods: [],
  totals: totals(0),
});

function detail(status: string, meals = [meal('m1', 1, 'Café da manhã'), meal('m2', 2, 'Almoço')]) {
  return {
    plan: {
      id: 'pl1',
      patientId: 'p1',
      patientName: 'Paciente Exemplo',
      nutritionistId: 'n1',
      nutritionistName: 'Nutri Exemplo',
      name: 'Plano de teste',
      description: null,
      startDate: '2026-10-15',
      endDate: null,
      status,
      createdAt: '2026-10-14T18:00:00Z',
      targetEnergyKcal: null,
      targetProteinGrams: null,
      targetCarbohydrateGrams: null,
      targetFatGrams: null,
    },
    meals,
    dailyTotals: totals(0),
  };
}

describe('PlanEditorPage', () => {
  let fixture: ComponentFixture<PlanEditorPage>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  function button(name: string | RegExp): HTMLButtonElement {
    const found = [...element.querySelectorAll('button')].find((b) => {
      const label = b.getAttribute('aria-label') ?? b.textContent?.trim() ?? '';
      return typeof name === 'string' ? label.includes(name) : name.test(label);
    });
    if (!found) throw new Error(`Botão "${name}" não encontrado`);
    return found;
  }

  async function load(status: string, meals?: ReturnType<typeof meal>[]): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ planId: 'pl1' }) } },
        },
      ],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PlanEditorPage);
    element = fixture.nativeElement;
    await settle();
    controller.expectOne(URL).flush(detail(status, meals));
    await settle();
  }

  afterEach(() => controller.verify());

  it('rascunho: mostra ativar e cancelar; ativo: finalizar; finalizado: só leitura', async () => {
    await load('Draft');
    expect(element.textContent).toContain('Ativar plano');
    expect(element.textContent).toContain('Cancelar rascunho');
    expect(element.textContent).not.toContain('Finalizar plano');

    fixture.destroy();
    TestBed.resetTestingModule();
    await load('Finished');
    expect(element.textContent).toContain('Plano finalizado: só leitura.');
    expect(element.textContent).not.toContain('Adicionar refeição');
    expect(element.querySelector('[aria-label^="Remover"]')).toBeNull();
    expect(element.textContent).toContain('Baixar PDF');
  });

  it('avisa quando o horário cai fora da rotina do paciente', async () => {
    await load('Draft', [meal('m1', 1, 'Ceia', true)]);

    expect(element.textContent).toContain('fora da rotina do paciente');
  });

  it('descer uma refeição manda a lista inteira na nova ordem e recarrega', async () => {
    await load('Draft');

    button('Descer Café da manhã').click();
    await settle();
    const request = controller.expectOne(`${URL}/meals/order`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ mealIds: ['m2', 'm1'] });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    controller
      .expectOne(URL)
      .flush(detail('Draft', [meal('m2', 1, 'Almoço'), meal('m1', 2, 'Café da manhã')]));
  });

  it('não deixa adicionar a 11ª refeição', async () => {
    const ten = Array.from({ length: 10 }, (_, i) => meal(`m${i}`, i + 1, `Refeição ${i + 1}`));
    await load('Active', ten);

    expect(button('Adicionar refeição').disabled).toBe(true);
    expect(element.textContent).toContain('limite de 10 refeições');
  });

  it('remove um alimento depois de confirmar, e mostra o 409 da API dentro do diálogo', async () => {
    const withFood = {
      ...meal('m1', 1, 'Almoço'),
      foods: [
        {
          id: 'mf1',
          foodId: 'f1',
          quantityInGrams: 150,
          name: 'Arroz, integral, cozido',
          brand: null,
          source: 'Taco',
          sourceReference: '1',
          snapshotTakenAtUtc: '2026-10-28T10:00:00Z',
          energyKcalPer100g: 124,
          proteinPer100g: 2.6,
          carbohydratePer100g: 25.8,
          fatPer100g: 1,
          fiberPer100g: 2.7,
          sodiumMgPer100g: 1,
          attribution: 'TACO',
          portion: {
            energyKcal: 186,
            protein: 3.9,
            carbohydrate: 38.7,
            fat: 1.5,
            fiber: 4,
            sodiumMg: 1.5,
          },
        },
      ],
    } as unknown as ReturnType<typeof meal>;
    await load('Active', [withFood]);

    button('Remover Arroz, integral, cozido da refeição').click();
    await settle();
    button(/^Remover alimento$/).click();
    await settle();
    controller
      .expectOne(`${URL}/meals/m1/foods/mf1`)
      .flush(
        { title: 'Um plano finalizado ou cancelado não pode ser alterado.' },
        { status: 409, statusText: 'Conflict' },
      );
    await settle();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('não pode ser alterado');
  });
});

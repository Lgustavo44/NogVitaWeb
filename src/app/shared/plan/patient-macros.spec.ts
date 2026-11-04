import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meal, NutritionPlanDetail, normalizePlanDetail } from '../domain/nutrition-plan';
import { MealCard } from './meal-card';
import { PlanDaySummary } from './plan-day-summary';

registerLocaleData(localePt);

const total = (value: number) => ({ value, isComplete: true });

/** Como a API manda para o paciente com os macros escondidos (E6.7). */
function hiddenMacrosDetail(): NutritionPlanDetail {
  const totals = {
    energyKcal: total(450),
    protein: null,
    carbohydrate: null,
    fat: null,
    fiber: total(4),
    sodiumMg: total(120),
  };
  return normalizePlanDetail({
    plan: {} as NutritionPlanDetail['plan'],
    meals: [
      {
        id: 'm1',
        name: 'Café da manhã',
        notes: null,
        order: 1,
        suggestedTime: null,
        outsideRoutine: null,
        macrosVisible: false,
        totals,
        foods: [
          {
            id: 'f1',
            foodId: 'a1',
            quantityInGrams: 150,
            name: 'Arroz',
            brand: null,
            source: 'Taco',
            sourceReference: '1',
            snapshotTakenAtUtc: '2026-11-04T00:00:00Z',
            attribution: null,
            energyKcalPer100g: 124,
            proteinPer100g: null,
            carbohydratePer100g: null,
            fatPer100g: null,
            fiberPer100g: 2.7,
            sodiumMgPer100g: 1,
            portion: {
              energyKcal: 186,
              protein: null,
              carbohydrate: null,
              fat: null,
              fiber: 4,
              sodiumMg: 1,
            },
          },
        ],
      },
    ] as unknown as Meal[],
    dailyTotals: totals,
    target: null,
    macrosVisible: false,
  });
}

@Component({
  imports: [MealCard, PlanDaySummary],
  template: `
    <app-meal-card [meal]="detail().meals[0]" audience="patient" />
    <app-plan-day-summary [totals]="detail().dailyTotals" />
  `,
})
class Host {
  readonly detail = signal(hiddenMacrosDetail());
}

describe('macros escondidos para o paciente (E6.7)', () => {
  it('a normalização mantém o null da API, sem virar zero', () => {
    const detail = hiddenMacrosDetail();
    expect(detail.dailyTotals.protein).toBeNull();
    expect(detail.dailyTotals.energyKcal.value).toBe(450);
    expect(detail.macrosVisible).toBe(false);
  });

  it('a refeição e o resumo do dia mostram as calorias, sem proteína, carboidrato e gordura', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('186 kcal');
    expect(text).toContain('450 kcal');
    expect(text).toContain('Fibras');
    for (const hidden of [
      'Proteínas',
      'Carboidratos',
      'Gorduras',
      'P —',
      'De onde vêm as calorias',
    ]) {
      expect(text).not.toContain(hidden);
    }
  });
});

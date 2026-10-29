import { NutritionPlanDetail, isEditable, normalizePlanDetail } from './nutrition-plan';

describe('plano alimentar', () => {
  it('só rascunho e ativo podem ser editados', () => {
    expect(isEditable('Draft')).toBe(true);
    expect(isEditable('Active')).toBe(true);
    expect(isEditable('Finished')).toBe(false);
    expect(isEditable('Cancelled')).toBe(false);
  });

  it('normaliza números em texto, sem transformar "sem informação" em zero', () => {
    const raw = {
      plan: { id: 'pl1', status: 'Draft', targetEnergyKcal: '2200', targetFatGrams: null },
      meals: [
        {
          id: 'm1',
          order: '1',
          foods: [
            {
              id: 'mf1',
              quantityInGrams: '150',
              energyKcalPer100g: '124',
              fiberPer100g: null,
              portion: { energyKcal: '186', fiber: null },
            },
          ],
          totals: { energyKcal: { value: '186', isComplete: true } },
        },
      ],
      dailyTotals: { energyKcal: { value: '186', isComplete: true } },
    } as unknown as NutritionPlanDetail;

    const detail = normalizePlanDetail(raw);

    expect(detail.plan.targetEnergyKcal).toBe(2200);
    expect(detail.plan.targetFatGrams).toBeNull();
    expect(detail.meals[0].order).toBe(1);
    expect(detail.meals[0].foods[0].quantityInGrams).toBe(150);
    expect(detail.meals[0].foods[0].energyKcalPer100g).toBe(124);
    expect(detail.meals[0].foods[0].fiberPer100g).toBeNull();
    expect(detail.meals[0].foods[0].portion.energyKcal).toBe(186);
    expect(detail.meals[0].foods[0].portion.fiber).toBeNull();
    expect(detail.meals[0].outsideRoutine).toBeNull();
    expect(detail.dailyTotals.energyKcal).toEqual({ value: 186, isComplete: true });
    expect(detail.target).toBeNull();
  });
});

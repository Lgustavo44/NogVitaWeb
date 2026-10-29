import { kcalToKj, normalizeNutrients, toNutrient } from './food';

describe('nutrientes', () => {
  it('aceita número ou texto (a API declara os dois) e não transforma "sem informação" em zero', () => {
    expect(toNutrient(25.8)).toBe(25.8);
    expect(toNutrient('25.8')).toBe(25.8);
    expect(toNutrient('25,8')).toBe(25.8);
    expect(toNutrient(0)).toBe(0);
    expect(toNutrient(null)).toBeNull();
    expect(toNutrient('')).toBeNull();
    expect(toNutrient('abc')).toBeNull();
  });

  it('normaliza os seis nutrientes sem mexer no resto', () => {
    const food = normalizeNutrients({
      name: 'Arroz',
      energyKcalPer100g: '124' as unknown as number,
      proteinPer100g: 2.6,
      carbohydratePer100g: null,
      fatPer100g: '1' as unknown as number,
      fiberPer100g: 2.7,
      sodiumMgPer100g: null,
    });

    expect(food).toEqual({
      name: 'Arroz',
      energyKcalPer100g: 124,
      proteinPer100g: 2.6,
      carbohydratePer100g: null,
      fatPer100g: 1,
      fiberPer100g: 2.7,
      sodiumMgPer100g: null,
    });
  });

  it('converte kcal para kJ', () => {
    expect(Math.round(kcalToKj(124))).toBe(519);
  });
});

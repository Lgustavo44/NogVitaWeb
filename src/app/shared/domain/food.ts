/** Fonte do alimento. A atribuição de cada fonte tem que aparecer na tela (a licença ODbL exige). */
export type FoodSource = 'Taco' | 'OpenFoodFacts';

export const FOOD_SOURCE_LABELS: Record<FoodSource, string> = {
  Taco: 'TACO',
  OpenFoodFacts: 'Open Food Facts',
};

/** Valores por 100 g. `null` é "sem informação", nunca zero. */
export interface NutrientsPer100g {
  energyKcalPer100g: number | null;
  proteinPer100g: number | null;
  carbohydratePer100g: number | null;
  fatPer100g: number | null;
  fiberPer100g: number | null;
  sodiumMgPer100g: number | null;
}

export interface Food extends NutrientsPer100g {
  id: string;
  name: string;
  /** Só Open Food Facts. */
  brand: string | null;
  barcode: string | null;
  /** Só TACO. */
  category: string | null;
  source: FoodSource;
  sourceReference: string;
  isActive: boolean;
  attribution: string | null;
  /** false quando algum dos seis nutrientes está sem informação. */
  isComplete: boolean;
}

export interface ProductPreview extends NutrientsPer100g {
  alreadyImported: boolean;
  foodId: string | null;
  barcode: string;
  name: string;
  brand: string | null;
  attribution: string | null;
}

export type NutrientKey = keyof NutrientsPer100g;

/** Os seis nutrientes que a API devolve, na ordem de exibição. */
export const NUTRIENTS: readonly { key: NutrientKey; label: string; unit: 'kcal' | 'g' | 'mg' }[] =
  [
    { key: 'energyKcalPer100g', label: 'Energia', unit: 'kcal' },
    { key: 'carbohydratePer100g', label: 'Carboidratos', unit: 'g' },
    { key: 'proteinPer100g', label: 'Proteínas', unit: 'g' },
    { key: 'fatPer100g', label: 'Gorduras totais', unit: 'g' },
    { key: 'fiberPer100g', label: 'Fibras', unit: 'g' },
    { key: 'sodiumMgPer100g', label: 'Sódio', unit: 'mg' },
  ];

const NUTRIENT_KEYS = NUTRIENTS.map((nutrient) => nutrient.key);

/**
 * A API declara os números como "number ou string": normaliza para number | null,
 * sem transformar "sem informação" em zero.
 */
export function toNutrient(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const number = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : null;
}

export function normalizeNutrients<T extends NutrientsPer100g>(item: T): T {
  const copy = { ...item };
  for (const key of NUTRIENT_KEYS) {
    copy[key] = toNutrient(item[key]);
  }
  return copy;
}

/** kcal → kJ (1 kcal = 4,184 kJ). */
export function kcalToKj(kcal: number): number {
  return kcal * 4.184;
}

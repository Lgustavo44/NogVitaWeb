import { FoodSource, NutrientsPer100g, normalizeNutrients, toNutrient } from './food';

/** Rascunho, ativo, finalizado e cancelado. O paciente só vê os ativos e finalizados. */
export type PlanStatus = 'Draft' | 'Active' | 'Finished' | 'Cancelled';

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  Draft: 'Rascunho',
  Active: 'Ativo',
  Finished: 'Finalizado',
  Cancelled: 'Cancelado',
};

/** Um plano tem no máximo 10 refeições (a API devolve 409 depois disso). */
export const MAX_MEALS = 10;

export interface NutritionPlan {
  id: string;
  patientId: string;
  patientName: string;
  nutritionistId: string;
  nutritionistName: string;
  name: string;
  description: string | null;
  /** Data sem hora, no horário de Brasília. */
  startDate: string;
  /** `null`: sem data prevista de término. */
  endDate: string | null;
  status: PlanStatus;
  createdAt: string;
  targetEnergyKcal: number | null;
  targetProteinGrams: number | null;
  targetCarbohydrateGrams: number | null;
  targetFatGrams: number | null;
}

/** Quantidades de uma porção (já calculadas pela API). `null`: a fonte não informa. */
export interface NutrientAmounts {
  energyKcal: number | null;
  protein: number | null;
  carbohydrate: number | null;
  fat: number | null;
  fiber: number | null;
  sodiumMg: number | null;
}

/** Soma de um nutriente. `isComplete` é false quando algum alimento não informa o nutriente. */
export interface NutrientTotal {
  value: number;
  isComplete: boolean;
}

export interface NutrientTotals {
  energyKcal: NutrientTotal;
  protein: NutrientTotal;
  carbohydrate: NutrientTotal;
  fat: NutrientTotal;
  fiber: NutrientTotal;
  sodiumMg: NutrientTotal;
}

export interface NutrientComparison {
  target: number;
  planned: number;
  difference: number;
  isComplete: boolean;
}

/** Meta do dia × o planejado. Proteína, carboidrato e gordura são opcionais na meta. */
export interface TargetComparison {
  energyKcal: NutrientComparison;
  protein: NutrientComparison | null;
  carbohydrate: NutrientComparison | null;
  fat: NutrientComparison | null;
}

/**
 * Alimento da refeição. Os valores por 100 g são uma cópia tirada ao adicionar
 * (`snapshotTakenAtUtc`): mudanças na base não alteram planos já montados.
 */
export interface MealFood extends NutrientsPer100g {
  id: string;
  foodId: string;
  quantityInGrams: number;
  name: string;
  brand: string | null;
  source: FoodSource;
  sourceReference: string;
  snapshotTakenAtUtc: string;
  attribution: string | null;
  portion: NutrientAmounts;
}

export interface Meal {
  id: string;
  name: string;
  notes: string | null;
  order: number;
  /** "HH:mm:ss" ou `null`. Não define a ordem. */
  suggestedTime: string | null;
  /** true: o horário cai enquanto o paciente dorme (aviso, sem bloquear). null: sem rotina ou sem horário. */
  outsideRoutine: boolean | null;
  foods: MealFood[];
  totals: NutrientTotals;
}

export interface NutritionPlanDetail {
  plan: NutritionPlan;
  meals: Meal[];
  dailyTotals: NutrientTotals;
  /** Só quando o plano tem meta. */
  target: TargetComparison | null;
}

export interface PlanRequest {
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
}

export interface MealRequest {
  name: string;
  notes: string | null;
  /** "HH:mm" ou `null`. */
  suggestedTime: string | null;
}

export interface PlanTargetRequest {
  energyKcal: number;
  proteinGrams: number | null;
  carbohydrateGrams: number | null;
  fatGrams: number | null;
}

/** Editar (plano, refeições, alimentos e meta) só em rascunho ou ativo. */
export function isEditable(status: PlanStatus): boolean {
  return status === 'Draft' || status === 'Active';
}

/* A API declara os números como "number ou string": tudo passa por aqui antes da tela. */

export function normalizePlan(plan: NutritionPlan): NutritionPlan {
  return {
    ...plan,
    targetEnergyKcal: toNutrient(plan.targetEnergyKcal),
    targetProteinGrams: toNutrient(plan.targetProteinGrams),
    targetCarbohydrateGrams: toNutrient(plan.targetCarbohydrateGrams),
    targetFatGrams: toNutrient(plan.targetFatGrams),
  };
}

export function normalizePlanDetail(raw: NutritionPlanDetail): NutritionPlanDetail {
  return {
    plan: normalizePlan(raw.plan),
    meals: (raw.meals ?? []).map(normalizeMeal),
    dailyTotals: normalizeTotals(raw.dailyTotals),
    target: raw.target ? normalizeTarget(raw.target) : null,
  };
}

function normalizeMeal(meal: Meal): Meal {
  return {
    ...meal,
    order: Number(meal.order),
    outsideRoutine: meal.outsideRoutine ?? null,
    foods: (meal.foods ?? []).map((food) => ({
      ...normalizeNutrients(food),
      quantityInGrams: toNutrient(food.quantityInGrams) ?? 0,
      portion: normalizeAmounts(food.portion),
    })),
    totals: normalizeTotals(meal.totals),
  };
}

const AMOUNT_KEYS = ['energyKcal', 'protein', 'carbohydrate', 'fat', 'fiber', 'sodiumMg'] as const;

function normalizeAmounts(amounts: NutrientAmounts | undefined): NutrientAmounts {
  return Object.fromEntries(
    AMOUNT_KEYS.map((key) => [key, toNutrient(amounts?.[key])]),
  ) as unknown as NutrientAmounts;
}

function normalizeTotal(total: NutrientTotal | undefined): NutrientTotal {
  return { value: toNutrient(total?.value) ?? 0, isComplete: total?.isComplete ?? true };
}

function normalizeTotals(totals: NutrientTotals | undefined): NutrientTotals {
  return Object.fromEntries(
    AMOUNT_KEYS.map((key) => [key, normalizeTotal(totals?.[key])]),
  ) as unknown as NutrientTotals;
}

function normalizeComparison(comparison: NutrientComparison): NutrientComparison {
  return {
    target: toNutrient(comparison.target) ?? 0,
    planned: toNutrient(comparison.planned) ?? 0,
    difference: toNutrient(comparison.difference) ?? 0,
    isComplete: comparison.isComplete,
  };
}

function normalizeTarget(target: TargetComparison): TargetComparison {
  return {
    energyKcal: normalizeComparison(target.energyKcal),
    protein: target.protein ? normalizeComparison(target.protein) : null,
    carbohydrate: target.carbohydrate ? normalizeComparison(target.carbohydrate) : null,
    fat: target.fat ? normalizeComparison(target.fat) : null,
  };
}

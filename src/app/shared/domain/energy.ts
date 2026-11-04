import { BiologicalSex } from './patient-enums';

/**
 * Gasto basal estimado (Mifflin-St Jeor, 1990), em kcal/dia, arredondado.
 * Só uma estimativa e sem as atividades: quem define a meta é o nutricionista (D-V2-02).
 */
export function basalMetabolicRate(
  sex: BiologicalSex,
  weightKg: number,
  heightCm: number,
  ageInYears: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageInYears;
  return Math.round(base + (sex === 'Male' ? 5 : -161));
}

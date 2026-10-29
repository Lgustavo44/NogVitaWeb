/** Enums da API (trafegam como texto) e os rótulos para a tela. */

export type BiologicalSex = 'Male' | 'Female';
export type Goal = 'WeightLoss' | 'Maintenance' | 'MuscleGain';

export const BIOLOGICAL_SEX_LABELS: Record<BiologicalSex, string> = {
  Male: 'Masculino',
  Female: 'Feminino',
};

export const GOAL_LABELS: Record<Goal, string> = {
  WeightLoss: 'Emagrecimento',
  Maintenance: 'Manutenção',
  MuscleGain: 'Ganho de massa',
};

/** Para valores que a API possa mandar no futuro: mostra o texto cru em vez de quebrar. */
export function goalLabel(goal: string): string {
  return GOAL_LABELS[goal as Goal] ?? goal;
}

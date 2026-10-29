/** Registro de peso (paciente ou nutricionista). `recordedOn` é uma data sem hora (AAAA-MM-DD). */
export interface WeightRecord {
  id: string;
  recordedOn: string;
  weightKg: number;
  notes: string | null;
  recordedByPatient: boolean;
  recordedByName: string;
}

/**
 * Um registro por dia: se quem registra já tem um registro nessa data, ele é atualizado (200);
 * se o registro do dia foi feito pelo outro (paciente ou nutricionista), a API recusa (409).
 * A data vale de hoje até 365 dias atrás.
 */
export interface RecordWeightRequest {
  weightKg: number;
  recordedOn: string | null;
  notes: string | null;
}

/** Até onde a API aceita registrar para trás. */
export const WEIGHT_MAX_DAYS_BACK = 365;

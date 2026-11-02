import { BiologicalSex, Goal } from '../../shared/domain/patient-enums';

export interface NutritionistProfile {
  userId: string;
  name: string;
  email: string;
  crnRegion: number;
  crnNumber: string;
  bio: string | null;
  /** Pública (não expira); nula sem foto. */
  photoUrl?: string | null;
}

export interface MyPatientItem {
  patientId: string;
  name: string;
  goal: Goal;
  startedAtUtc: string;
  photoUrl?: string | null;
}

export interface LatestWeight {
  weightKg: number;
  recordedOn: string;
}

export type { RecordWeightRequest, WeightRecord } from '../../shared/domain/weight';

export interface FollowedPatient {
  patientId: string;
  name: string;
  age: number;
  biologicalSex: BiologicalSex;
  heightInCm: number;
  goal: Goal;
  wakeUpTime: string | null;
  bedTime: string | null;
  trainingTime: string | null;
  bodyMassIndex: number | null;
  latestWeight: LatestWeight | null;
  photoUrl?: string | null;
}

export type RequestStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';

export interface NutritionistRequestItem {
  id: string;
  patientId: string;
  patientName: string;
  /** Só vem nos pedidos pendentes. */
  patientPhotoUrl?: string | null;
  status: RequestStatus;
  message: string | null;
  createdAt: string;
  respondedAtUtc: string | null;
}

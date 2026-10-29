import { Goal } from '../../shared/domain/patient-enums';
import { BiologicalSex } from '../../shared/domain/patient-enums';

export interface NutritionistProfile {
  userId: string;
  name: string;
  email: string;
  crnRegion: number;
  crnNumber: string;
  bio: string | null;
}

export interface MyPatientItem {
  patientId: string;
  name: string;
  goal: Goal;
  startedAtUtc: string;
}

export interface LatestWeight {
  weightKg: number;
  recordedOn: string;
}

export interface WeightRecord {
  id: string;
  recordedOn: string;
  weightKg: number;
  notes: string | null;
  recordedByPatient: boolean;
  recordedByName: string;
}

export interface RecordWeightRequest {
  weightKg: number;
  recordedOn: string | null;
  notes: string | null;
}

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
}

export type RequestStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';

export interface NutritionistRequestItem {
  id: string;
  patientId: string;
  patientName: string;
  status: RequestStatus;
  message: string | null;
  createdAt: string;
  respondedAtUtc: string | null;
}

import { BiologicalSex, Goal } from '../../shared/domain/patient-enums';

export interface PatientProfile {
  userId: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  age: number;
  biologicalSex: BiologicalSex;
  heightInCm: number;
  goal: Goal;
  /** Horários locais; voltam com segundos ("07:00:00"). */
  wakeUpTime: string | null;
  bedTime: string | null;
  trainingTime: string | null;
}

/** Horários enviados como "HH:mm". Nome, e-mail e CPF não podem ser alterados. */
export interface UpdatePatientProfileRequest {
  birthDate: string;
  biologicalSex: BiologicalSex;
  heightInCm: number;
  goal: Goal;
  wakeUpTime: string | null;
  bedTime: string | null;
  trainingTime: string | null;
}

export interface MyCareRelationship {
  relationshipId: string;
  nutritionistId: string;
  nutritionistName: string;
  crnRegion: number;
  crnNumber: string;
  bio: string | null;
  startedAtUtc: string;
}

export interface NutritionistListItem {
  userId: string;
  name: string;
  crnRegion: number;
  crnNumber: string;
  bio: string | null;
}

export interface RequestNutritionistRequest {
  nutritionistId: string;
  message: string | null;
}

export type NutritionistRequestStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';

export interface PatientRequestItem {
  id: string;
  nutritionistId: string;
  nutritionistName: string;
  status: NutritionistRequestStatus;
  message: string | null;
  createdAt: string;
  respondedAtUtc: string | null;
}

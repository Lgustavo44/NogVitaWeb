import { Goal } from '../../shared/domain/patient-enums';

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

import { BiologicalSex, Goal } from '../../shared/domain/patient-enums';

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  isAdmin: boolean;
  isPatient: boolean;
  isNutritionist: boolean;
  createdAt: string;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  cpf: string;
  isActive: boolean;
  isAdmin: boolean;
  patient: {
    birthDate: string;
    biologicalSex: BiologicalSex;
    heightInCm: number;
    goal: Goal;
  } | null;
  nutritionist: { crnRegion: number; crnNumber: string; isActive: boolean } | null;
  createdAt: string;
  updatedAt: string | null;
}

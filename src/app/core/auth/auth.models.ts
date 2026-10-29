export interface LoginRequest {
  email: string;
  password: string;
}

export type BiologicalSex = 'Male' | 'Female';
export type PatientGoal = 'WeightLoss' | 'Maintenance' | 'MuscleGain';

export interface PatientRegistrationRequest {
  name: string;
  email: string;
  cpf: string;
  password: string;
  birthDate: string;
  biologicalSex: BiologicalSex;
  heightInCm: number;
  goal: PatientGoal;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

export interface InvitationAcceptRequest {
  token: string;
  password: string | null;
}

export interface PatientProfile {
  userId: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  age: number;
  biologicalSex: BiologicalSex;
  heightInCm: number;
  goal: PatientGoal;
  wakeUpTime: string | null;
  bedTime: string | null;
  trainingTime: string | null;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
}

export interface MeResponse {
  userId: string;
  roles: string[];
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
}

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

export interface NutritionistPatientSummary {
  patientId: string;
  name: string;
  goal: string;
  startedAtUtc: string;
}

export interface NutritionistProfile {
  userId: string;
  name: string;
  email: string;
  crnRegion: number;
  crnNumber: string;
  bio: string | null;
}

export interface MessageResponse {
  message: string;
}

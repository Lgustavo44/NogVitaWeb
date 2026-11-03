import { BiologicalSex, Goal } from '../../shared/domain/patient-enums';

/** Papéis que a API devolve em `GET /auth/me`. Um usuário pode ter mais de um. */
export type Role = 'Patient' | 'Nutritionist' | 'Admin';

export interface LoginRequest {
  email: string;
  password: string;
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

export interface PatientRegistrationRequest {
  name: string;
  email: string;
  cpf: string;
  password: string;
  birthDate: string;
  biologicalSex: BiologicalSex;
  heightInCm: number;
  goal: Goal;
  /** A `version` do termo de `GET /patients/health-data-consent`, com os dois aceites. */
  healthDataConsentVersion: string;
  acceptHealthData: boolean;
  acceptInternationalTransfer: boolean;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

export interface InvitationAcceptRequest {
  token: string;
  password: string | null;
}

export interface MessageResponse {
  message: string;
}

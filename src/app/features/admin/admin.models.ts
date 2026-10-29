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
  /** `isActive` aqui é o perfil (convite aceito), não a conta. */
  nutritionist: { crnRegion: number; crnNumber: string; isActive: boolean } | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminPatientSummary {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  birthDate: string;
  goal: Goal;
  createdAt: string;
}

export interface AdminNutritionistSummary {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  crnRegion: number;
  crnNumber: string;
  /** false: o convite ainda não foi aceito (dá para reenviar ou cancelar o pré-cadastro). */
  isProfileActive: boolean;
  createdAt: string;
}

export interface PreRegisterNutritionistRequest {
  name: string;
  email: string;
  cpf: string;
  crnRegion: number;
  crnNumber: string;
}

/** `invitationEmailSent: false`: o cadastro foi feito, mas o e-mail falhou (reenvie o convite). */
export interface PreRegisterNutritionistResponse {
  userId: string;
  invitationEmailSent: boolean;
}

export interface InvitationEmailResponse {
  invitationEmailSent: boolean;
}

/** Filtro das listagens pela situação da conta. */
export type AccountFilter = 'all' | 'active' | 'inactive';

/** O CRN tem 11 regiões (regra da API para o pré-cadastro). */
export const CRN_REGIONS = Array.from({ length: 11 }, (_, index) => index + 1);

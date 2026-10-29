import { Role } from './auth.models';

/** Cada papel tem a sua área no app. A URL é a fonte da verdade de em qual área a pessoa está. */
export interface Area {
  role: Role;
  path: string;
  label: string;
  description: string;
}

export const AREAS: Record<Role, Area> = {
  Patient: {
    role: 'Patient',
    path: '/paciente',
    label: 'Paciente',
    description: 'Seu plano alimentar, seu peso e seu nutricionista.',
  },
  Nutritionist: {
    role: 'Nutritionist',
    path: '/nutricionista',
    label: 'Nutricionista',
    description: 'Seus pacientes, solicitações e planos alimentares.',
  },
  Admin: {
    role: 'Admin',
    path: '/admin',
    label: 'Administração',
    description: 'Usuários, nutricionistas e alimentos.',
  },
};

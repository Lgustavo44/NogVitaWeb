import { Routes } from '@angular/router';

export const NUTRITIONIST_ROUTES: Routes = [
  {
    path: '',
    title: 'Início · NogVita',
    loadComponent: () => import('./home/nutritionist-home').then((m) => m.NutritionistHome),
  },
  {
    path: 'perfil',
    title: 'Meu perfil · NogVita',
    loadComponent: () =>
      import('./profile/nutritionist-profile').then((m) => m.NutritionistProfilePage),
  },
  {
    path: 'pacientes',
    title: 'Meus pacientes · NogVita',
    loadComponent: () =>
      import('./patients/nutritionist-patients').then((m) => m.NutritionistPatientsPage),
  },
  {
    path: 'pacientes/:patientId',
    title: 'Detalhe do paciente · NogVita',
    loadComponent: () => import('./patients/patient-detail').then((m) => m.PatientDetailPage),
  },
  {
    path: 'solicitacoes',
    title: 'Solicitações · NogVita',
    loadComponent: () =>
      import('./requests/nutritionist-requests').then((m) => m.NutritionistRequestsPage),
  },
];

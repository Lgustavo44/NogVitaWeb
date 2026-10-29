import { Routes } from '@angular/router';

export const PATIENT_ROUTES: Routes = [
  {
    path: '',
    title: 'Início · NogVita',
    loadComponent: () => import('./home/patient-home').then((m) => m.PatientHome),
  },
  {
    path: 'perfil',
    title: 'Meu perfil · NogVita',
    loadComponent: () => import('./profile/patient-profile').then((m) => m.PatientProfilePage),
  },
  {
    path: 'encontrar-nutricionista',
    title: 'Encontrar nutricionista · NogVita',
    loadComponent: () =>
      import('./find-nutritionist/find-nutritionist').then((m) => m.FindNutritionistPage),
  },
  {
    path: 'peso',
    title: 'Meu peso · NogVita',
    loadComponent: () => import('./weight/patient-weight').then((m) => m.PatientWeightPage),
  },
  {
    path: 'meu-nutricionista',
    title: 'Meu nutricionista · NogVita',
    loadComponent: () =>
      import('./my-nutritionist/my-nutritionist').then((m) => m.MyNutritionistPage),
  },
  {
    path: 'minhas-solicitacoes',
    title: 'Minhas solicitações · NogVita',
    loadComponent: () => import('./requests/patient-requests').then((m) => m.PatientRequestsPage),
  },
];

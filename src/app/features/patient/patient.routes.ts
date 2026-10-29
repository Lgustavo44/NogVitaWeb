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
];

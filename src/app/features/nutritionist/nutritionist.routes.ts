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
];

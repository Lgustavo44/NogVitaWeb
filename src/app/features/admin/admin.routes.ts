import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    title: 'Painel · NogVita',
    loadComponent: () => import('./home/admin-home').then((m) => m.AdminHome),
  },
];

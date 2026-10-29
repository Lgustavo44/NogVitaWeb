import { Routes } from '@angular/router';
import { redirectIfAuthenticated, requireSession } from './core/auth/auth.guards';
import { PublicLayout } from './shared/layout/public-layout/public-layout';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      {
        path: 'login',
        title: 'Entrar · NogVita',
        canActivate: [redirectIfAuthenticated],
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'cadastro',
        title: 'Criar conta · NogVita',
        canActivate: [redirectIfAuthenticated],
        loadComponent: () =>
          import('./features/auth/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
      {
        path: 'esqueci-senha',
        title: 'Esqueci minha senha · NogVita',
        loadComponent: () =>
          import('./features/auth/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
      {
        path: 'inicio',
        title: 'Início · NogVita',
        canActivate: [requireSession],
        loadComponent: () => import('./features/auth/welcome/welcome').then((m) => m.Welcome),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];

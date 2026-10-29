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
          import('./features/auth/register/register').then((m) => m.Register),
      },
      {
        path: 'esqueci-senha',
        title: 'Esqueci minha senha · NogVita',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
      },
      {
        path: 'redefinir-senha',
        title: 'Redefinir senha · NogVita',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
      },
      {
        path: 'nutri/convite',
        title: 'Convite de nutricionista · NogVita',
        loadComponent: () =>
          import('./features/auth/nutritionist-invitation/nutritionist-invitation').then(
            (m) => m.NutritionistInvitation,
          ),
      },
      {
        path: 'confirmar-email',
        title: 'Confirmar e-mail · NogVita',
        loadComponent: () =>
          import('./features/auth/email-verification/email-verification').then(
            (m) => m.EmailVerification,
          ),
      },
      {
        path: 'sem-permissao',
        title: 'Sem permissão · NogVita',
        loadComponent: () =>
        import('./shared/ui/status-page/status-page').then((m) => m.StatusPage),
        data: { status: 'forbidden' },
      },
      {
        path: 'sessao-expirada',
        title: 'Sessão expirada · NogVita',
        loadComponent: () =>
        import('./shared/ui/status-page/status-page').then((m) => m.StatusPage),
        data: { status: 'session-expired' },
      },
    ],
  },
  {
    path: 'inicio',
    title: 'Início · NogVita',
    canActivate: [requireSession],
    loadComponent: () =>
      import('./features/workspace/workspace-entry').then((m) => m.WorkspaceEntry),
  },
  {
    path: 'inicio/paciente',
    title: 'Painel do paciente · NogVita',
    canActivate: [requireSession],
    loadComponent: () =>
      import('./features/patient/home/patient-home').then((m) => m.PatientHome),
  },
  {
    path: 'inicio/nutricionista',
    title: 'Painel do nutricionista · NogVita',
    canActivate: [requireSession],
    loadComponent: () =>
      import('./features/nutritionist/home/nutritionist-home').then((m) => m.NutritionistHome),
  },
  {
    path: 'inicio/admin',
    title: 'Painel administrativo · NogVita',
    canActivate: [requireSession],
    loadComponent: () =>
      import('./features/admin/home/admin-home').then((m) => m.AdminHome),
  },
  {
    path: '**',
    title: 'Página não encontrada · NogVita',
    loadComponent: () => import('./shared/ui/status-page/status-page').then((m) => m.StatusPage),
    data: { status: 'not-found' },
  },
];

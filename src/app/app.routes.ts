import { Routes } from '@angular/router';
import { redirectIfAuthenticated, requireRole, requireSession } from './core/auth/auth.guards';
import { PublicLayout } from './shared/layout/public-layout/public-layout';

const statusPage = () => import('./shared/ui/status-page/status-page').then((m) => m.StatusPage);

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
        data: { layout: 'wide' },
        loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
      },
      {
        path: 'esqueci-senha',
        title: 'Esqueci minha senha · NogVita',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
      },
      // As três rotas abaixo recebem os links dos e-mails, com o token no fragmento (#token=...).
      {
        path: 'confirmar-email',
        title: 'Confirmar e-mail · NogVita',
        loadComponent: () =>
          import('./features/auth/email-verification/email-verification').then(
            (m) => m.EmailVerification,
          ),
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
        path: 'inicio',
        title: 'Início · NogVita',
        canActivate: [requireSession],
        loadComponent: () =>
          import('./features/auth/area-choice/area-choice').then((m) => m.AreaChoice),
      },
      {
        path: 'sem-permissao',
        title: 'Sem permissão · NogVita',
        loadComponent: statusPage,
        data: { status: 'forbidden' },
      },
      {
        path: 'sessao-expirada',
        title: 'Sessão expirada · NogVita',
        loadComponent: statusPage,
        data: { status: 'session-expired' },
      },
      {
        path: 'indisponivel',
        title: 'Servidor indisponível · NogVita',
        loadComponent: statusPage,
        data: { status: 'unavailable' },
      },
    ],
  },

  // Áreas logadas: cada uma com o AppShell e o próprio menu. O guard confere o papel antes de carregar.
  {
    path: 'paciente',
    canActivate: [requireSession, requireRole('Patient')],
    loadComponent: () => import('./features/patient/patient-area').then((m) => m.PatientArea),
    loadChildren: () => import('./features/patient/patient.routes').then((m) => m.PATIENT_ROUTES),
  },
  {
    path: 'nutricionista',
    canActivate: [requireSession, requireRole('Nutritionist')],
    loadComponent: () =>
      import('./features/nutritionist/nutritionist-area').then((m) => m.NutritionistArea),
    loadChildren: () =>
      import('./features/nutritionist/nutritionist.routes').then((m) => m.NUTRITIONIST_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [requireSession, requireRole('Admin')],
    loadComponent: () => import('./features/admin/admin-area').then((m) => m.AdminArea),
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },

  {
    path: '**',
    component: PublicLayout,
    children: [
      {
        path: '**',
        title: 'Página não encontrada · NogVita',
        loadComponent: statusPage,
        data: { status: 'not-found' },
      },
    ],
  },
];

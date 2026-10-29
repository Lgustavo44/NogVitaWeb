import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'usuarios',
    title: 'Usuários · NogVita',
    loadComponent: () => import('./users/admin-users').then((m) => m.AdminUsersPage),
  },
  {
    path: 'usuarios/:id',
    title: 'Detalhe do usuário · NogVita',
    loadComponent: () => import('./users/admin-user-detail').then((m) => m.AdminUserDetailPage),
  },
  {
    path: 'nutricionistas',
    title: 'Nutricionistas · NogVita',
    loadComponent: () =>
      import('./nutritionists/admin-nutritionists').then((m) => m.AdminNutritionistsPage),
  },
  {
    path: 'nutricionistas/:id',
    title: 'Detalhe do nutricionista · NogVita',
    loadComponent: () =>
      import('./nutritionists/admin-nutritionist-detail').then(
        (m) => m.AdminNutritionistDetailPage,
      ),
  },
  {
    path: 'pacientes',
    title: 'Pacientes · NogVita',
    loadComponent: () => import('./patients/admin-patients').then((m) => m.AdminPatientsPage),
  },
  {
    path: 'pacientes/:id',
    title: 'Detalhe do paciente · NogVita',
    loadComponent: () =>
      import('./patients/admin-patient-detail').then((m) => m.AdminPatientDetailPage),
  },
  {
    path: 'alimentos',
    title: 'Alimentos · NogVita',
    loadComponent: () => import('./foods/admin-foods').then((m) => m.AdminFoodsPage),
  },
  {
    path: '',
    title: 'Painel · NogVita',
    loadComponent: () => import('./home/admin-home').then((m) => m.AdminHome),
  },
];

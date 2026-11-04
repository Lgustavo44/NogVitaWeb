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
  {
    path: 'planos',
    title: 'Planos alimentares · NogVita',
    loadComponent: () => import('./plans/plans-page').then((m) => m.PlansPage),
  },
  {
    path: 'planos/:planId',
    title: 'Plano alimentar · NogVita',
    loadComponent: () => import('./plans/plan-editor').then((m) => m.PlanEditorPage),
  },
  {
    path: 'questionarios',
    title: 'Questionários de anamnese · NogVita',
    loadComponent: () =>
      import('./anamnesis/questionnaires-page').then((m) => m.QuestionnairesPage),
  },
  {
    path: 'questionarios/novo',
    title: 'Novo questionário · NogVita',
    loadComponent: () =>
      import('./anamnesis/questionnaire-editor').then((m) => m.QuestionnaireEditorPage),
  },
  {
    path: 'questionarios/:questionnaireId',
    title: 'Editar questionário · NogVita',
    loadComponent: () =>
      import('./anamnesis/questionnaire-editor').then((m) => m.QuestionnaireEditorPage),
  },
  {
    path: 'anamneses/:anamnesisId',
    title: 'Anamnese · NogVita',
    loadComponent: () => import('./anamnesis/anamnesis-page').then((m) => m.AnamnesisPage),
  },
  {
    path: 'alimentos',
    title: 'Alimentos · NogVita',
    loadComponent: () => import('./foods/food-search').then((m) => m.FoodSearchPage),
  },
  // Antes de ':foodId', senão "codigo-de-barras" seria lido como um id.
  {
    path: 'alimentos/codigo-de-barras',
    title: 'Adicionar por código de barras · NogVita',
    loadComponent: () => import('./foods/barcode-import').then((m) => m.BarcodeImportPage),
  },
  {
    path: 'alimentos/:foodId',
    title: 'Alimento · NogVita',
    loadComponent: () => import('./foods/food-detail').then((m) => m.FoodDetailPage),
  },
];

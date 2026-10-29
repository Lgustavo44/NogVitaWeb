import { httpResource } from '@angular/common/http';
import { apiUrl } from '../../core/http/api-url';
import { MyCareRelationship, NutritionPlanDetail, PatientProfile } from './patient.models';

/*
 * Recursos da área do paciente. Cada função cria um httpResource e deve ser chamada
 * no contexto de injeção (campo de componente): ela traz `value`, `isLoading`, `error` e `reload`.
 */

export function patientProfileResource() {
  return httpResource<PatientProfile>(() => apiUrl('/patients/me'));
}

/** 404 "Você não está em acompanhamento." é estado normal. */
export function careRelationshipResource() {
  return httpResource<MyCareRelationship>(() => apiUrl('/patients/me/care-relationship'));
}

/** 404 "Você não tem um plano ativo." é estado normal. */
export function currentPlanResource() {
  return httpResource<NutritionPlanDetail>(() => apiUrl('/patients/me/nutrition-plans/current'));
}

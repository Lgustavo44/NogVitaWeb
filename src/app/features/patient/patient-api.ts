import { HttpClient, httpResource } from '@angular/common/http';
import { Service, Signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../core/http/api-url';
import { PagedResponse } from '../../shared/domain/paged-response';
import {
  MyCareRelationship,
  NutritionPlanDetail,
  PatientProfile,
  RequestNutritionistRequest,
  NutritionistListItem,
  NutritionistRequestStatus,
  PatientRequestItem,
  UpdatePatientProfileRequest,
} from './patient.models';

/** Escritas da área do paciente. As leituras são os httpResource abaixo. */
@Service()
export class PatientApi {
  private readonly http = inject(HttpClient);

  /** Envie sempre os três horários: horário omitido ou null apaga o valor salvo. */
  updateProfile(body: UpdatePatientProfileRequest): Observable<unknown> {
    return this.http.put(apiUrl('/patients/me'), body);
  }

  requestNutritionist(body: RequestNutritionistRequest): Observable<unknown> {
    return this.http.post(apiUrl('/patients/me/nutritionist-requests'), body);
  }

  endCareRelationship(): Observable<void> {
    return this.http.post<void>(apiUrl('/patients/me/care-relationship/end'), {});
  }

  cancelNutritionistRequest(id: string): Observable<void> {
    return this.http.post<void>(apiUrl(`/patients/me/nutritionist-requests/${id}/cancel`), {});
  }
}

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

export function nutritionistsResource(
  search: Signal<string>,
  crnRegion: Signal<number | null>,
  page: Signal<number>,
  pageSize = 12,
) {
  return httpResource<PagedResponse<NutritionistListItem>>(() => ({
    url: apiUrl('/nutritionists'),
    params: {
      page: page(),
      pageSize,
      ...(search().trim() ? { search: search().trim() } : {}),
      ...(crnRegion() ? { crnRegion: crnRegion()! } : {}),
    },
  }));
}

export function patientRequestsResource(
  status: Signal<NutritionistRequestStatus | null>,
  pageSize = 50,
) {
  return httpResource<PagedResponse<PatientRequestItem>>(() => ({
    url: apiUrl('/patients/me/nutritionist-requests'),
    params: {
      page: 1,
      pageSize,
      ...(status() ? { status: status()! } : {}),
    },
  }));
}

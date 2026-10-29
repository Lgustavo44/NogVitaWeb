import { HttpClient, httpResource } from '@angular/common/http';
import { Service, Signal, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../core/http/api-url';
import {
  NutritionPlan,
  NutritionPlanDetail,
  PlanStatus,
  normalizePlan,
  normalizePlanDetail,
} from '../../shared/domain/nutrition-plan';
import { PagedResponse } from '../../shared/domain/paged-response';
import {
  MyCareRelationship,
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

  /** O PDF precisa do token, então vem pelo HttpClient (um link direto daria 401). */
  planPdf(planId: string): Observable<Blob> {
    return this.http.get(apiUrl(`/patients/me/nutrition-plans/${planId}/pdf`), {
      responseType: 'blob',
    });
  }

  /**
   * Envia o PDF para o e-mail da conta. No máximo 3 envios por hora (429 depois disso);
   * 503 quando o envio falha (dá para baixar).
   */
  emailPlanPdf(planId: string): Observable<void> {
    return this.http.post<void>(apiUrl(`/patients/me/nutrition-plans/${planId}/pdf/email`), {});
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
  return httpResource(() => apiUrl('/patients/me/nutrition-plans/current'), {
    parse: (raw) => normalizePlanDetail(raw as NutritionPlanDetail),
  });
}

/** Rascunhos e cancelados nunca aparecem para o paciente. 404: plano inexistente ou não visível. */
export function patientPlanResource(planId: Signal<string | null>) {
  return httpResource(
    () => {
      const id = planId();
      return id ? apiUrl(`/patients/me/nutrition-plans/${id}`) : undefined;
    },
    { parse: (raw) => normalizePlanDetail(raw as NutritionPlanDetail) },
  );
}

/** O ativo primeiro, depois os finalizados (inclusive de nutricionistas anteriores). */
export function patientPlansResource(status: Signal<PlanStatus | null> = signal(null)) {
  return httpResource(
    () => ({
      url: apiUrl('/patients/me/nutrition-plans'),
      params: { page: 1, pageSize: 50, ...(status() ? { status: status()! } : {}) },
    }),
    {
      parse: (raw) => {
        const response = raw as PagedResponse<NutritionPlan>;
        return { ...response, items: response.items.map(normalizePlan) };
      },
    },
  );
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

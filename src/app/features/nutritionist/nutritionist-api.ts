import { HttpClient, httpResource } from '@angular/common/http';
import { Service, Signal, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../core/http/api-url';
import { PagedResponse } from '../../shared/domain/paged-response';
import {
  MyPatientItem,
  FollowedPatient,
  NutritionistProfile,
  NutritionistRequestItem,
  RequestStatus,
} from './nutritionist.models';

/** Escritas da área do nutricionista. As leituras são os httpResource abaixo. */
@Service()
export class NutritionistApi {
  private readonly http = inject(HttpClient);

  /** Só a bio é editável (até 500 caracteres). `null` ou vazio apaga. */
  updateBio(bio: string | null): Observable<unknown> {
    return this.http.put(apiUrl('/nutritionists/me'), { bio });
  }

  endPatientCare(patientId: string): Observable<void> {
    return this.http.post<void>(apiUrl(`/nutritionists/me/patients/${patientId}/end`), {});
  }

  acceptRequest(id: string): Observable<void> {
    return this.http.post<void>(apiUrl(`/nutritionists/me/requests/${id}/accept`), {});
  }

  rejectRequest(id: string): Observable<void> {
    return this.http.post<void>(apiUrl(`/nutritionists/me/requests/${id}/reject`), {});
  }
}

/* Recursos da área do nutricionista (chamar no contexto de injeção). */

export function nutritionistProfileResource() {
  return httpResource<NutritionistProfile>(() => apiUrl('/nutritionists/me'));
}

/** Em ordem alfabética. `totalItems` traz quantos pacientes estão em acompanhamento. */
export function myPatientsResource(
  search: Signal<string> = signal(''),
  page: Signal<number> = signal(1),
  pageSize = 10,
) {
  return httpResource<PagedResponse<MyPatientItem>>(() => ({
    url: apiUrl('/nutritionists/me/patients'),
    params: { page: page(), pageSize, ...(search().trim() ? { search: search().trim() } : {}) },
  }));
}

export function followedPatientResource(patientId: Signal<string | null>) {
  return httpResource<FollowedPatient>(() => {
    const id = patientId();
    return id ? apiUrl(`/nutritionists/me/patients/${id}`) : undefined;
  });
}

/** Da mais recente para a mais antiga. */
export function pendingRequestsResource(pageSize = 5) {
  return nutritionistRequestsResource(signal<RequestStatus | null>('Pending'), pageSize);
}

export function nutritionistRequestsResource(status: Signal<RequestStatus | null>, pageSize = 50) {
  return httpResource<PagedResponse<NutritionistRequestItem>>(() => ({
    url: apiUrl('/nutritionists/me/requests'),
    params: {
      page: 1,
      pageSize,
      ...(status() ? { status: status()! } : {}),
    },
  }));
}

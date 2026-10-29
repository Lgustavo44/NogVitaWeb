import { HttpClient, httpResource } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../core/http/api-url';
import { PagedResponse } from '../../shared/domain/paged-response';
import { MyPatientItem, NutritionistProfile, NutritionistRequestItem } from './nutritionist.models';

/** Escritas da área do nutricionista. As leituras são os httpResource abaixo. */
@Service()
export class NutritionistApi {
  private readonly http = inject(HttpClient);

  /** Só a bio é editável (até 500 caracteres). `null` ou vazio apaga. */
  updateBio(bio: string | null): Observable<unknown> {
    return this.http.put(apiUrl('/nutritionists/me'), { bio });
  }
}

/* Recursos da área do nutricionista (chamar no contexto de injeção). */

export function nutritionistProfileResource() {
  return httpResource<NutritionistProfile>(() => apiUrl('/nutritionists/me'));
}

/** Em ordem alfabética. `totalItems` traz quantos pacientes estão em acompanhamento. */
export function myPatientsResource(pageSize = 5) {
  return httpResource<PagedResponse<MyPatientItem>>(() => ({
    url: apiUrl('/nutritionists/me/patients'),
    params: { page: 1, pageSize },
  }));
}

/** Da mais recente para a mais antiga. */
export function pendingRequestsResource(pageSize = 5) {
  return httpResource<PagedResponse<NutritionistRequestItem>>(() => ({
    url: apiUrl('/nutritionists/me/requests'),
    params: { status: 'Pending', page: 1, pageSize },
  }));
}

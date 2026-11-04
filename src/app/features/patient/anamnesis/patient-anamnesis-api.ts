import { HttpClient, httpResource } from '@angular/common/http';
import { Service, Signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/http/api-url';
import { Anamnesis, AnamnesisSummary, Answer } from '../../../shared/anamnesis/anamnesis.models';
import { PagedResponse } from '../../../shared/domain/paged-response';

const ANAMNESES = '/patients/me/anamneses';

@Service()
export class PatientAnamnesisApi {
  private readonly http = inject(HttpClient);

  /** Uma vez só: respondida, fica travada (409). Obrigatória sem resposta ou opção fora da lista: 422. */
  answer(id: string, answers: Answer[]): Observable<void> {
    return this.http.post<void>(apiUrl(`${ANAMNESES}/${id}/answers`), { answers });
  }
}

/** Pendentes primeiro, depois as respondidas, da mais recente para a mais antiga. */
export function myAnamnesesResource() {
  // shortcut: só a primeira página (100, o máximo da API); paginar se alguém passar disso.
  return httpResource<PagedResponse<AnamnesisSummary>>(() => ({
    url: apiUrl(ANAMNESES),
    params: { page: 1, pageSize: 100 },
  }));
}

export function myAnamnesisResource(id: Signal<string>) {
  return httpResource<Anamnesis>(() => apiUrl(`${ANAMNESES}/${id()}`));
}

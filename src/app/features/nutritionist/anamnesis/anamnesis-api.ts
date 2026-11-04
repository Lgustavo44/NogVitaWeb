import { HttpClient, httpResource } from '@angular/common/http';
import { Service, Signal, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/http/api-url';
import {
  Anamnesis,
  AnamnesisSummary,
  Questionnaire,
  QuestionnaireRequest,
  QuestionnaireSummary,
} from '../../../shared/anamnesis/anamnesis.models';
import { PagedResponse } from '../../../shared/domain/paged-response';

const QUESTIONNAIRES = '/nutritionists/me/questionnaires';
/** shortcut: só a primeira página (100, o máximo da API); paginar se alguém passar disso. */
const FIRST_PAGE = { page: 1, pageSize: 100 };

/** Escritas da anamnese do nutricionista (questionários e envio). */
@Service()
export class AnamnesisApi {
  private readonly http = inject(HttpClient);

  /** O modelo base da API (14 perguntas, sem ids), para começar um questionário. */
  template(): Observable<QuestionnaireRequest> {
    return this.http.get<QuestionnaireRequest>(apiUrl(`${QUESTIONNAIRES}/template`));
  }

  create(body: QuestionnaireRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(apiUrl(QUESTIONNAIRES), body);
  }

  update(id: string, body: QuestionnaireRequest): Observable<void> {
    return this.http.put<void>(apiUrl(`${QUESTIONNAIRES}/${id}`), body);
  }

  /** Não muda as anamneses já enviadas. */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(apiUrl(`${QUESTIONNAIRES}/${id}`));
  }

  /** Só com acompanhamento ativo (404 se não houver). */
  send(patientId: string, questionnaireId: string): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(
      apiUrl(`/nutritionists/me/patients/${patientId}/anamneses`),
      { questionnaireId },
    );
  }
}

/** Questionários do nutricionista, em ordem alfabética. `enabled` false: não busca. */
export function questionnairesResource(enabled: Signal<boolean> = signal(true)) {
  return httpResource<PagedResponse<QuestionnaireSummary>>(() =>
    enabled() ? { url: apiUrl(QUESTIONNAIRES), params: FIRST_PAGE } : undefined,
  );
}

export function questionnaireResource(id: Signal<string | null>) {
  return httpResource<Questionnaire>(() => {
    const value = id();
    return value ? apiUrl(`${QUESTIONNAIRES}/${value}`) : undefined;
  });
}

/** Anamneses de um paciente, da mais recente para a mais antiga. */
export function patientAnamnesesResource(patientId: Signal<string>) {
  return httpResource<PagedResponse<AnamnesisSummary>>(() => ({
    url: apiUrl(`/nutritionists/me/patients/${patientId()}/anamneses`),
    params: FIRST_PAGE,
  }));
}

export function anamnesisResource(id: Signal<string>) {
  return httpResource<Anamnesis>(() => apiUrl(`/nutritionists/me/anamneses/${id()}`));
}

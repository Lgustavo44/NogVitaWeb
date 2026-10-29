import { HttpClient, httpResource } from '@angular/common/http';
import { Service, Signal, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { apiUrl } from '../../../core/http/api-url';
import {
  MealRequest,
  NutritionPlan,
  NutritionPlanDetail,
  PlanRequest,
  PlanTargetRequest,
  normalizePlan,
  normalizePlanDetail,
} from '../../../shared/domain/nutrition-plan';
import { PagedResponse } from '../../../shared/domain/paged-response';

const PLANS = '/nutritionists/me/nutrition-plans';

/**
 * Escritas do plano alimentar. Tudo responde 409 quando o status do plano não permite
 * (editar só em rascunho ou ativo) e 404 quando o acompanhamento acabou.
 * Depois de qualquer escrita, recarregue o detalhe: totais e avisos de horário vêm calculados.
 */
@Service()
export class PlansApi {
  private readonly http = inject(HttpClient);

  /** Cria como rascunho: o paciente ainda não vê. */
  create(patientId: string, body: PlanRequest): Observable<string> {
    return this.http
      .post<{ id: string }>(apiUrl(PLANS), { patientId, ...body })
      .pipe(map((response) => response.id));
  }

  update(planId: string, body: PlanRequest): Observable<void> {
    return this.http.put<void>(apiUrl(`${PLANS}/${planId}`), body);
  }

  /** Só rascunho. Finaliza, na mesma operação, o plano ativo anterior do paciente. */
  activate(planId: string): Observable<void> {
    return this.http.post<void>(apiUrl(`${PLANS}/${planId}/activate`), {});
  }

  /** Só ativo. A data de término vira hoje. */
  finish(planId: string): Observable<void> {
    return this.http.post<void>(apiUrl(`${PLANS}/${planId}/finish`), {});
  }

  /** Só rascunho (um plano ativo é finalizado, não cancelado). */
  cancel(planId: string): Observable<void> {
    return this.http.post<void>(apiUrl(`${PLANS}/${planId}/cancel`), {});
  }

  setTarget(planId: string, body: PlanTargetRequest): Observable<void> {
    return this.http.put<void>(apiUrl(`${PLANS}/${planId}/target`), body);
  }

  removeTarget(planId: string): Observable<void> {
    return this.http.delete<void>(apiUrl(`${PLANS}/${planId}/target`));
  }

  /** Entra no fim da ordem. 409 com 10 refeições. */
  addMeal(planId: string, body: MealRequest): Observable<string> {
    return this.http
      .post<{ id: string }>(apiUrl(`${PLANS}/${planId}/meals`), body)
      .pipe(map((response) => response.id));
  }

  updateMeal(planId: string, mealId: string, body: MealRequest): Observable<void> {
    return this.http.put<void>(apiUrl(`${PLANS}/${planId}/meals/${mealId}`), body);
  }

  /** As demais são renumeradas sem buracos. */
  deleteMeal(planId: string, mealId: string): Observable<void> {
    return this.http.delete<void>(apiUrl(`${PLANS}/${planId}/meals/${mealId}`));
  }

  /** A lista inteira, na ordem final (todas as refeições, uma vez cada). */
  reorderMeals(planId: string, mealIds: string[]): Observable<void> {
    return this.http.put<void>(apiUrl(`${PLANS}/${planId}/meals/order`), { mealIds });
  }

  addFood(planId: string, mealId: string, foodId: string, quantityInGrams: number) {
    return this.http.post<{ id: string }>(apiUrl(`${PLANS}/${planId}/meals/${mealId}/foods`), {
      foodId,
      quantityInGrams,
    });
  }

  /** Muda só a quantidade: a cópia dos valores por 100 g continua a mesma. */
  updateFood(
    planId: string,
    mealId: string,
    mealFoodId: string,
    quantityInGrams: number,
  ): Observable<void> {
    return this.http.put<void>(apiUrl(`${PLANS}/${planId}/meals/${mealId}/foods/${mealFoodId}`), {
      quantityInGrams,
    });
  }

  deleteFood(planId: string, mealId: string, mealFoodId: string): Observable<void> {
    return this.http.delete<void>(apiUrl(`${PLANS}/${planId}/meals/${mealId}/foods/${mealFoodId}`));
  }

  /** O PDF precisa do token, então vem pelo HttpClient (um link direto daria 401). */
  pdf(planId: string): Observable<Blob> {
    return this.http.get(apiUrl(`${PLANS}/${planId}/pdf`), { responseType: 'blob' });
  }
}

/** Planos que você criou para o paciente, do mais recente para o mais antigo. */
export function patientPlansResource(patientId: Signal<string | null>) {
  return httpResource(
    () => {
      const id = patientId();
      return id
        ? {
            url: apiUrl(`/nutritionists/me/patients/${id}/nutrition-plans`),
            params: { page: 1, pageSize: 50 },
          }
        : undefined;
    },
    {
      parse: (raw) => {
        const response = raw as PagedResponse<NutritionPlan>;
        return { ...response, items: response.items.map(normalizePlan) };
      },
    },
  );
}

/** Plano, refeições, alimentos, totais e comparação com a meta. */
export function planDetailResource(planId: Signal<string | null>) {
  return httpResource(
    () => {
      const id = planId();
      return id ? apiUrl(`${PLANS}/${id}`) : undefined;
    },
    { parse: (raw) => normalizePlanDetail(raw as NutritionPlanDetail) },
  );
}

import { HttpClient, httpResource } from '@angular/common/http';
import { Service, Signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../core/http/api-url';
import { FOOD_SEARCH_MIN, Food, FoodSource, normalizeNutrients } from '../../shared/domain/food';
import { PagedResponse } from '../../shared/domain/paged-response';
import {
  AccountFilter,
  AdminNutritionistSummary,
  AdminPatientSummary,
  AdminUserDetail,
  AdminUserSummary,
  InvitationEmailResponse,
  PreRegisterNutritionistRequest,
  PreRegisterNutritionistResponse,
} from './admin.models';

type AdminList = 'users' | 'patients' | 'nutritionists';

/** Escritas da administração. As leituras são os httpResource abaixo. */
@Service()
export class AdminApi {
  private readonly http = inject(HttpClient);

  /** 400 "Senha não definida.": nutricionista que não aceitou o convite (reenvie o convite). */
  activateUser(id: string): Observable<void> {
    return this.http.post<void>(apiUrl(`/admin/users/${id}/activate`), {});
  }

  /**
   * Encerra as sessões. Nutricionista: encerra os acompanhamentos, finaliza ou cancela os planos
   * e recusa as solicitações. 409: o admin não pode desativar a própria conta.
   */
  deactivateUser(id: string): Observable<void> {
    return this.http.post<void>(apiUrl(`/admin/users/${id}/deactivate`), {});
  }

  /** 409 com mensagem genérica de propósito (CRN já usado, já é nutricionista, ou dados de pessoas diferentes). */
  preRegisterNutritionist(
    body: PreRegisterNutritionistRequest,
  ): Observable<PreRegisterNutritionistResponse> {
    return this.http.post<PreRegisterNutritionistResponse>(apiUrl('/admin/nutritionists'), body);
  }

  /** Gera um convite novo e invalida os anteriores. 409: o convite já foi aceito. */
  resendInvitation(id: string): Observable<InvitationEmailResponse> {
    return this.http.post<InvitationEmailResponse>(
      apiUrl(`/admin/nutritionists/${id}/invitation`),
      {},
    );
  }

  /** Só convite nunca aceito (409 depois disso: desative a conta). */
  cancelPreRegistration(id: string): Observable<void> {
    return this.http.delete<void>(apiUrl(`/admin/nutritionists/${id}`));
  }

  activateFood(id: string): Observable<void> {
    return this.http.post<void>(apiUrl(`/admin/foods/${id}/activate`), {});
  }

  /** Some da busca e da prévia; os planos que já usam o alimento guardam uma cópia e não mudam. */
  deactivateFood(id: string): Observable<void> {
    return this.http.post<void>(apiUrl(`/admin/foods/${id}/deactivate`), {});
  }
}

/* Recursos da administração (chamar no contexto de injeção). */

/** Só o total de uma lista (`pageSize=1`): os números do painel vêm de `totalItems`, não da página. */
export function adminTotalResource(
  list: AdminList,
  filters: Record<string, string | boolean> = {},
) {
  return httpResource<PagedResponse<unknown>>(() => ({
    url: apiUrl(`/admin/${list}`),
    params: { ...filters, page: 1, pageSize: 1 },
  }));
}

/** Usuários mais recentes primeiro; `search` filtra por nome ou e-mail no servidor. */
export function adminUsersResource(search: Signal<string>, pageSize = 8) {
  return httpResource<PagedResponse<AdminUserSummary>>(() => {
    const term = search().trim();
    return {
      url: apiUrl('/admin/users'),
      params: { page: 1, pageSize, ...(term ? { search: term } : {}) },
    };
  });
}

export interface AdminListQuery {
  search: Signal<string>;
  status: Signal<AccountFilter>;
  page: Signal<number>;
  pageSize: number;
}

function listRequest(list: AdminList, query: AdminListQuery) {
  const term = query.search().trim();
  const status = query.status();
  return {
    url: apiUrl(`/admin/${list}`),
    params: {
      page: query.page(),
      pageSize: query.pageSize,
      ...(term ? { search: term } : {}),
      ...(status === 'all' ? {} : { isActive: status === 'active' }),
    },
  };
}

/** Listagens paginadas, da conta mais nova para a mais antiga. */
export function adminUserListResource(query: AdminListQuery) {
  return httpResource<PagedResponse<AdminUserSummary>>(() => listRequest('users', query));
}

export function adminPatientsResource(query: AdminListQuery) {
  return httpResource<PagedResponse<AdminPatientSummary>>(() => listRequest('patients', query));
}

export function adminNutritionistsResource(query: AdminListQuery) {
  return httpResource<PagedResponse<AdminNutritionistSummary>>(() =>
    listRequest('nutritionists', query),
  );
}

/** A busca de alimentos, incluindo os desativados. Como a busca comum, só a partir de 2 caracteres. */
export function adminFoodsResource(
  search: Signal<string>,
  source: Signal<FoodSource | null>,
  page: Signal<number>,
  pageSize: number,
) {
  return httpResource(
    () => {
      const term = search().trim();
      if (term.length < FOOD_SEARCH_MIN) {
        return undefined;
      }
      const sourceFilter = source();
      return {
        url: apiUrl('/admin/foods'),
        params: {
          search: term,
          page: page(),
          pageSize,
          ...(sourceFilter ? { source: sourceFilter } : {}),
        },
      };
    },
    {
      parse: (raw) => {
        const response = raw as PagedResponse<Food>;
        return { ...response, items: response.items.map((food) => normalizeNutrients(food)) };
      },
    },
  );
}

/**
 * Detalhe de qualquer usuário, com os perfis de paciente e de nutricionista.
 * (`/admin/patients/{id}` e `/admin/nutritionists/{id}` devolvem o mesmo formato.)
 * Também é de onde vem o nome do próprio admin, que não tem um "/me" de perfil.
 */
export function adminUserResource(userId: Signal<string | null>) {
  return httpResource<AdminUserDetail>(() => {
    const id = userId();
    return id ? apiUrl(`/admin/users/${id}`) : undefined;
  });
}

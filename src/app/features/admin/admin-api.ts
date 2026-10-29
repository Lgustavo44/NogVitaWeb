import { httpResource } from '@angular/common/http';
import { Signal } from '@angular/core';
import { apiUrl } from '../../core/http/api-url';
import { PagedResponse } from '../../shared/domain/paged-response';
import { AdminUserDetail, AdminUserSummary } from './admin.models';

/* Recursos da administração (chamar no contexto de injeção). */

type AdminList = 'users' | 'patients' | 'nutritionists';

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

/** O próprio admin não tem um "/me" de perfil: o nome vem do detalhe do usuário. */
export function adminUserResource(userId: Signal<string | null>) {
  return httpResource<AdminUserDetail>(() => {
    const id = userId();
    return id ? apiUrl(`/admin/users/${id}`) : undefined;
  });
}

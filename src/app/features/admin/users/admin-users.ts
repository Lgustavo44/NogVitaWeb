import { DatePipe } from '@angular/common';
import { Component, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronRight } from '@lucide/angular';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { debounced } from '../../../shared/util/debounced';
import { adminUserListResource } from '../admin-api';
import { AccountFilter, AdminUserSummary } from '../admin.models';
import { AccountBadge } from '../ui/account-badge';
import { AdminListFilters } from '../ui/admin-list-filters';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-users',
  imports: [
    AccountBadge,
    AdminListFilters,
    DatePipe,
    LoadError,
    LucideChevronRight,
    PageHeader,
    Pagination,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <app-page-header
      badge="Administração"
      title="Usuários"
      subtitle="Todas as contas da plataforma. Abra uma conta para ver os perfis e ativar ou desativar o acesso."
    />

    <section
      class="flex flex-col gap-4 rounded-container bg-surface p-4 shadow-1 sm:p-5"
      aria-label="Usuários"
    >
      <app-admin-list-filters [(search)]="search" [(status)]="status" />

      @if (users.hasValue()) {
        @let list = users.value();
        <p class="text-body-sm text-ink-muted" role="status">
          {{ list.totalItems }} {{ list.totalItems === 1 ? 'conta' : 'contas' }}
        </p>
        @if (list.items.length === 0) {
          <p class="rounded-control bg-surface-muted p-6 text-center text-body-md text-ink-muted">
            Nenhuma conta encontrada com esses filtros.
          </p>
        } @else {
          <ul
            class="flex flex-col divide-y divide-divider"
            [attr.aria-busy]="users.isLoading()"
            [class.opacity-60]="users.isLoading()"
          >
            @for (user of list.items; track user.id) {
              <li>
                <a
                  [routerLink]="['/admin/usuarios', user.id]"
                  class="flex items-center gap-3 rounded-control px-2 py-3 hover:bg-surface-muted"
                >
                  <span
                    class="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-center md:gap-4"
                  >
                    <span class="flex min-w-0 flex-col md:w-72">
                      <span class="truncate text-label-lg text-ink">{{ user.name }}</span>
                      <span class="truncate text-body-sm text-ink-muted">{{ user.email }}</span>
                    </span>
                    <span class="flex flex-wrap items-center gap-1.5 md:flex-1">
                      @for (role of roles(user); track role) {
                        <span
                          class="rounded-pill bg-surface-muted px-2.5 py-0.5 text-label-sm text-ink"
                          >{{ role }}</span
                        >
                      }
                      <app-account-badge [active]="user.isActive" />
                    </span>
                    <span class="text-body-sm text-ink-muted md:w-36 md:text-right">
                      Desde {{ user.createdAt | date: 'dd/MM/yyyy' }}
                    </span>
                  </span>
                  <svg lucideChevronRight class="size-5 shrink-0 text-ink-muted"></svg>
                </a>
              </li>
            }
          </ul>
        }
        <app-pagination
          [page]="page()"
          [pageSize]="pageSize"
          [totalItems]="list.totalItems"
          (pageChange)="page.set($event)"
        />
      } @else if (users.error()) {
        <app-load-error [error]="users.error()" (retry)="users.reload()" />
      } @else {
        <div class="flex flex-col gap-2" aria-hidden="true">
          @for (row of [1, 2, 3, 4]; track row) {
            <div class="h-16 rounded-control bg-surface-muted motion-safe:animate-pulse"></div>
          }
        </div>
        <span class="sr-only" role="status">Carregando usuários…</span>
      }
    </section>
  `,
})
export class AdminUsersPage {
  protected readonly pageSize = PAGE_SIZE;
  protected readonly search = signal('');
  private readonly debouncedSearch = debounced(this.search);
  protected readonly status = signal<AccountFilter>('all');
  /** Volta para a página 1 sempre que a busca ou o filtro mudam. */
  protected readonly page = linkedSignal({
    source: () => [this.debouncedSearch(), this.status()],
    computation: () => 1,
  });
  protected readonly users = adminUserListResource({
    search: this.debouncedSearch,
    status: this.status,
    page: this.page,
    pageSize: PAGE_SIZE,
  });

  protected roles(user: AdminUserSummary): string[] {
    return [
      user.isAdmin ? 'Admin' : '',
      user.isNutritionist ? 'Nutricionista' : '',
      user.isPatient ? 'Paciente' : '',
    ].filter(Boolean);
  }
}

import { DatePipe } from '@angular/common';
import { Component, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronRight } from '@lucide/angular';
import { goalLabel } from '../../../shared/domain/patient-enums';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { debounced } from '../../../shared/util/debounced';
import { adminPatientsResource } from '../admin-api';
import { AccountFilter } from '../admin.models';
import { AccountBadge } from '../ui/account-badge';
import { AdminListFilters } from '../ui/admin-list-filters';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-patients',
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
      title="Pacientes"
      subtitle="Contas com perfil de paciente. Os dados de saúde ficam com o nutricionista: aqui só o cadastro."
    />

    <section
      class="flex flex-col gap-4 rounded-container bg-surface p-4 shadow-1 sm:p-5"
      aria-label="Pacientes"
    >
      <app-admin-list-filters [(search)]="search" [(status)]="status" />

      @if (patients.hasValue()) {
        @let list = patients.value();
        <p class="text-body-sm text-ink-muted" role="status">
          {{ list.totalItems }} {{ list.totalItems === 1 ? 'paciente' : 'pacientes' }}
        </p>
        @if (list.items.length === 0) {
          <p class="rounded-control bg-surface-muted p-6 text-center text-body-md text-ink-muted">
            Nenhum paciente encontrado com esses filtros.
          </p>
        } @else {
          <ul
            class="flex flex-col divide-y divide-divider"
            [attr.aria-busy]="patients.isLoading()"
            [class.opacity-60]="patients.isLoading()"
          >
            @for (item of list.items; track item.id) {
              <li>
                <a
                  [routerLink]="['/admin/usuarios', item.id]"
                  class="flex items-center gap-3 rounded-control px-2 py-3 hover:bg-surface-muted"
                >
                  <span
                    class="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-center md:gap-4"
                  >
                    <span class="flex min-w-0 flex-col md:w-72">
                      <span class="truncate text-label-lg text-ink">{{ item.name }}</span>
                      <span class="truncate text-body-sm text-ink-muted">{{ item.email }}</span>
                    </span>
                    <span class="text-body-md text-ink md:w-36">{{ goalLabel(item.goal) }}</span>
                    <span class="md:flex-1"><app-account-badge [active]="item.isActive" /></span>
                    <span class="text-body-sm text-ink-muted md:w-36 md:text-right">
                      Desde {{ item.createdAt | date: 'dd/MM/yyyy' }}
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
      } @else if (patients.error()) {
        <app-load-error [error]="patients.error()" (retry)="patients.reload()" />
      } @else {
        <div class="flex flex-col gap-2" aria-hidden="true">
          @for (row of [1, 2, 3, 4]; track row) {
            <div class="h-16 rounded-control bg-surface-muted motion-safe:animate-pulse"></div>
          }
        </div>
        <span class="sr-only" role="status">Carregando pacientes…</span>
      }
    </section>
  `,
})
export class AdminPatientsPage {
  protected readonly pageSize = PAGE_SIZE;
  protected readonly goalLabel = goalLabel;
  protected readonly search = signal('');
  private readonly debouncedSearch = debounced(this.search);
  protected readonly status = signal<AccountFilter>('all');
  protected readonly page = linkedSignal({
    source: () => [this.debouncedSearch(), this.status()],
    computation: () => 1,
  });
  protected readonly patients = adminPatientsResource({
    search: this.debouncedSearch,
    status: this.status,
    page: this.page,
    pageSize: PAGE_SIZE,
  });
}

import { DatePipe } from '@angular/common';
import { Component, inject, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronRight, LucideMailPlus } from '@lucide/angular';
import { Button } from '../../../shared/ui/button/button';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { debounced } from '../../../shared/util/debounced';
import { adminNutritionistsResource } from '../admin-api';
import { AccountFilter } from '../admin.models';
import { AccountBadge } from '../ui/account-badge';
import { AdminListFilters } from '../ui/admin-list-filters';
import { InviteNutritionistModal } from './invite-nutritionist-modal';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-nutritionists',
  imports: [
    AccountBadge,
    AdminListFilters,
    Button,
    DatePipe,
    InviteNutritionistModal,
    LoadError,
    LucideChevronRight,
    LucideMailPlus,
    PageHeader,
    Pagination,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <app-page-header
      badge="Administração"
      title="Nutricionistas"
      subtitle="Convide profissionais e acompanhe quem já aceitou o convite."
    >
      <button appButton type="button" (click)="inviteOpen.set(true)">
        <svg lucideMailPlus class="size-5"></svg>
        Convidar nutricionista
      </button>
    </app-page-header>

    <section
      class="flex flex-col gap-4 rounded-container bg-surface p-4 shadow-1 sm:p-5"
      aria-label="Nutricionistas"
    >
      <app-admin-list-filters [(search)]="search" [(status)]="status" />

      @if (nutritionists.hasValue()) {
        @let list = nutritionists.value();
        <p class="text-body-sm text-ink-muted" role="status">
          {{ list.totalItems }} {{ list.totalItems === 1 ? 'nutricionista' : 'nutricionistas' }}
        </p>
        @if (list.items.length === 0) {
          <p class="rounded-control bg-surface-muted p-6 text-center text-body-md text-ink-muted">
            Nenhum nutricionista encontrado com esses filtros.
          </p>
        } @else {
          <ul
            class="flex flex-col divide-y divide-divider"
            [attr.aria-busy]="nutritionists.isLoading()"
            [class.opacity-60]="nutritionists.isLoading()"
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
                    <span class="text-body-md text-ink tabular-nums md:w-32">
                      CRN-{{ item.crnRegion }} {{ item.crnNumber }}
                    </span>
                    <span class="md:flex-1">
                      <app-account-badge
                        [active]="item.isActive"
                        [pending]="item.isActive && !item.isProfileActive"
                      />
                    </span>
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
      } @else if (nutritionists.error()) {
        <app-load-error [error]="nutritionists.error()" (retry)="nutritionists.reload()" />
      } @else {
        <div class="flex flex-col gap-2" aria-hidden="true">
          @for (row of [1, 2, 3, 4]; track row) {
            <div class="h-16 rounded-control bg-surface-muted motion-safe:animate-pulse"></div>
          }
        </div>
        <span class="sr-only" role="status">Carregando nutricionistas…</span>
      }
    </section>

    @if (inviteOpen()) {
      <app-invite-nutritionist-modal
        (invited)="onInvited($event)"
        (closed)="inviteOpen.set(false)"
      />
    }
  `,
})
export class AdminNutritionistsPage {
  private readonly toaster = inject(Toaster);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly search = signal('');
  private readonly debouncedSearch = debounced(this.search);
  protected readonly status = signal<AccountFilter>('all');
  protected readonly page = linkedSignal({
    source: () => [this.debouncedSearch(), this.status()],
    computation: () => 1,
  });
  protected readonly nutritionists = adminNutritionistsResource({
    search: this.debouncedSearch,
    status: this.status,
    page: this.page,
    pageSize: PAGE_SIZE,
  });
  protected readonly inviteOpen = signal(false);

  /** Com o e-mail enviado, fecha; se o e-mail falhou, o modal fica aberto oferecendo o reenvio. */
  protected onInvited(result: { emailSent: boolean }): void {
    this.nutritionists.reload();
    if (result.emailSent) {
      this.inviteOpen.set(false);
      this.toaster.show('Convite enviado.');
    }
  }
}

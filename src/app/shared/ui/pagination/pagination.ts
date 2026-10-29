import { Component, computed, input, output } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { Button } from '../button/button';

/**
 * "Mostrando 1–20 de 37" e os botões Anterior/Próxima. O total de páginas é calculado pelo
 * `totalItems`, porque o `totalPages` é opcional na API. Some quando cabe tudo numa página.
 */
@Component({
  selector: 'app-pagination',
  imports: [Button, LucideChevronLeft, LucideChevronRight],
  template: `
    @if (totalPages() > 1) {
      <nav
        class="flex flex-wrap items-center justify-between gap-3 border-t border-divider pt-3"
        [attr.aria-label]="label()"
      >
        <p class="text-body-sm text-ink-muted tabular-nums">
          Mostrando {{ first() }}–{{ last() }} de {{ totalItems() }}
        </p>
        <div class="flex gap-2">
          <button
            appButton
            variant="ghost"
            type="button"
            [disabled]="page() <= 1"
            (click)="pageChange.emit(page() - 1)"
          >
            <svg lucideChevronLeft class="size-4"></svg>
            Anterior
          </button>
          <button
            appButton
            variant="ghost"
            type="button"
            [disabled]="page() >= totalPages()"
            (click)="pageChange.emit(page() + 1)"
          >
            Próxima
            <svg lucideChevronRight class="size-4"></svg>
          </button>
        </div>
      </nav>
    }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly label = input('Paginação');
  readonly pageChange = output<number>();

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.pageSize())),
  );
  protected readonly first = computed(() => (this.page() - 1) * this.pageSize() + 1);
  protected readonly last = computed(() =>
    Math.min(this.page() * this.pageSize(), this.totalItems()),
  );
}

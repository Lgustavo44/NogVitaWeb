import { Component, input, model } from '@angular/core';
import { LucideSearch } from '@lucide/angular';
import { AccountFilter } from '../admin.models';

const STATUS_OPTIONS: readonly { value: AccountFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Ativas' },
  { value: 'inactive', label: 'Desativadas' },
];

/** Busca por nome ou e-mail e filtro pela situação da conta, iguais nas listas do admin. */
@Component({
  selector: 'app-admin-list-filters',
  imports: [LucideSearch],
  host: { class: 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between' },
  template: `
    <label class="relative flex w-full items-center sm:max-w-sm">
      <span class="sr-only">{{ searchLabel() }}</span>
      <svg lucideSearch class="pointer-events-none absolute left-3 size-5 text-ink-muted"></svg>
      <input
        type="search"
        placeholder="Buscar por nome ou e-mail"
        maxlength="100"
        class="h-11 w-full rounded-control border border-line bg-surface pr-3 pl-10 text-body-lg text-ink placeholder:text-ink-muted/70 focus:border-focus focus:ring-4 focus:ring-primary/20 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        [value]="search()"
        (input)="onSearch($event)"
      />
    </label>
    <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar pela situação da conta">
      @for (option of options; track option.value) {
        <button
          type="button"
          class="min-h-10 cursor-pointer rounded-pill border border-divider px-4 text-label-lg text-ink-muted hover:text-ink aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary"
          [attr.aria-pressed]="status() === option.value"
          (click)="status.set(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class AdminListFilters {
  readonly search = model.required<string>();
  readonly status = model.required<AccountFilter>();
  readonly searchLabel = input('Buscar por nome ou e-mail');

  protected readonly options = STATUS_OPTIONS;

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
}

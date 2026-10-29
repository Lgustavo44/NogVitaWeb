import { DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideRefreshCw, LucideSearch, LucideUsers } from '@lucide/angular';
import { goalLabel } from '../../../shared/domain/patient-enums';
import { Button } from '../../../shared/ui/button/button';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { debounced } from '../../../shared/util/debounced';
import { myPatientsResource } from '../nutritionist-api';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-nutritionist-patients',
  imports: [
    Button,
    DatePipe,
    LoadError,
    LucideRefreshCw,
    LucideSearch,
    LucideUsers,
    PageHeader,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './nutritionist-patients.html',
})
export class NutritionistPatientsPage {
  /** O que está no campo agora; a API só recebe depois de a pessoa parar de digitar. */
  protected readonly search = signal('');
  private readonly debouncedSearch = debounced(this.search);
  protected readonly page = signal(1);
  protected readonly patients = myPatientsResource(this.debouncedSearch, this.page, PAGE_SIZE);
  protected readonly goalLabel = goalLabel;
  /** Calculado pelo totalItems: o totalPages é opcional na API. */
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil((this.patients.value()?.totalItems ?? 0) / PAGE_SIZE)),
  );
  protected readonly firstItem = computed(() =>
    this.patients.value()?.totalItems ? (this.page() - 1) * PAGE_SIZE + 1 : 0,
  );
  protected readonly lastItem = computed(() =>
    Math.min(this.page() * PAGE_SIZE, this.patients.value()?.totalItems ?? 0),
  );

  protected setSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.search.set(input.value);
    this.page.set(1);
  }

  protected previousPage(): void {
    if (this.page() > 1) this.page.update((page) => page - 1);
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages()) this.page.update((page) => page + 1);
  }

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts.at(-1)?.[0] ?? '')).toUpperCase();
  }
}

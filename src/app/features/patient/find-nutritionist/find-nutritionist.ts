import { Component, computed, inject, signal } from '@angular/core';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideCircleAlert,
  LucideFilterX,
  LucideInfo,
  LucideSearch,
  LucideSend,
  LucideUserRound,
  LucideVerified,
  LucideX,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../../core/http/api-error';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { PatientApi, nutritionistsResource } from '../patient-api';
import { NutritionistListItem } from '../patient.models';

const CRN_REGIONS = [
  { value: 1, label: 'CRN-1 (DF, GO, MT, TO)' },
  { value: 2, label: 'CRN-2 (RS)' },
  { value: 3, label: 'CRN-3 (SP, MS)' },
  { value: 4, label: 'CRN-4 (RJ, ES)' },
  { value: 5, label: 'CRN-5 (BA, SE)' },
  { value: 6, label: 'CRN-6 (AL, CE, PI)' },
  { value: 7, label: 'CRN-7 (GO, TO)' },
  { value: 8, label: 'CRN-8 (AM, AC, AP, PA, RO, RR)' },
  { value: 9, label: 'CRN-9 (PR)' },
  { value: 10, label: 'CRN-10 (SC)' },
  { value: 11, label: 'CRN-11 (MS)' },
  { value: 12, label: 'CRN-12 (PE, PB)' },
] as const;

@Component({
  selector: 'app-find-nutritionist',
  imports: [
    Alert,
    Button,
    LoadError,
    PageHeader,
    LucideChevronLeft,
    LucideChevronRight,
    LucideCircleAlert,
    LucideFilterX,
    LucideInfo,
    LucideSearch,
    LucideSend,
    LucideUserRound,
    LucideVerified,
    LucideX,
  ],
  host: {
    class: 'flex flex-col gap-6',
    '(document:keydown.escape)': 'closeModal()',
  },
  templateUrl: './find-nutritionist.html',
})
export class FindNutritionistPage {
  private readonly api = inject(PatientApi);
  private readonly toaster = inject(Toaster);

  protected readonly search = signal('');
  protected readonly crnRegion = signal<number | null>(null);
  protected readonly page = signal(1);
  protected readonly selected = signal<NutritionistListItem | null>(null);
  protected readonly message = signal('');
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly regions = CRN_REGIONS;
  protected readonly nutritionists = nutritionistsResource(
    this.search,
    this.crnRegion,
    this.page,
  );
  protected readonly pageLabel = computed(() => {
    const result = this.nutritionists.value();
    return result ? `Página ${result.page} de ${result.totalPages ?? result.page}` : '';
  });

  protected updateSearch(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.search.set(input.value);
      this.page.set(1);
    }
  }

  protected updateRegion(event: Event): void {
    const select = event.target;
    if (select instanceof HTMLSelectElement) {
      this.crnRegion.set(select.value ? Number(select.value) : null);
      this.page.set(1);
    }
  }

  protected updateMessage(event: Event): void {
    const textarea = event.target;
    if (textarea instanceof HTMLTextAreaElement) {
      this.message.set(textarea.value);
    }
  }

  protected clearFilters(): void {
    this.search.set('');
    this.crnRegion.set(null);
    this.page.set(1);
  }

  protected openModal(nutritionist: NutritionistListItem): void {
    this.selected.set(nutritionist);
    this.message.set('');
    this.submitError.set(null);
  }

  protected closeModal(): void {
    if (!this.submitting()) {
      this.selected.set(null);
    }
  }

  protected async request(): Promise<void> {
    const nutritionist = this.selected();
    if (!nutritionist || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);
    try {
      await firstValueFrom(
        this.api.requestNutritionist({
          nutritionistId: nutritionist.userId,
          message: this.message().trim() || null,
        }),
      );
      this.closeModal();
      this.toaster.show(`Solicitação enviada para ${nutritionist.name}.`);
    } catch (error) {
      this.submitError.set(toApiError(error).message);
    } finally {
      this.submitting.set(false);
    }
  }

  protected previousPage(): void {
    if (this.page() > 1) {
      this.page.update((value) => value - 1);
    }
  }

  protected nextPage(): void {
    const result = this.nutritionists.value();
    if (result && this.page() < (result.totalPages ?? result.page)) {
      this.page.update((value) => value + 1);
    }
  }
}

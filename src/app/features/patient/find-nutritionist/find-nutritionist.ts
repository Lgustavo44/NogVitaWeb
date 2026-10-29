import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideFilterX,
  LucideHourglass,
  LucideInfo,
  LucideSearch,
  LucideSend,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../../core/http/api-error';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { Modal } from '../../../shared/ui/modal/modal';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { debounced } from '../../../shared/util/debounced';
import {
  PatientApi,
  careRelationshipResource,
  nutritionistsResource,
  patientRequestsResource,
} from '../patient-api';
import { NutritionistListItem } from '../patient.models';

const PAGE_SIZE = 12;
const MESSAGE_MAX = 500;
/** O contrato da API não define as regiões; mostramos só o número, sem inventar estados. */
const CRN_REGIONS = Array.from({ length: 12 }, (_, index) => index + 1);

@Component({
  selector: 'app-find-nutritionist',
  imports: [
    Alert,
    Button,
    LoadError,
    LucideChevronLeft,
    LucideChevronRight,
    LucideFilterX,
    LucideHourglass,
    LucideInfo,
    LucideSearch,
    LucideSend,
    Modal,
    PageHeader,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './find-nutritionist.html',
})
export class FindNutritionistPage {
  private readonly api = inject(PatientApi);
  private readonly toaster = inject(Toaster);

  protected readonly regions = CRN_REGIONS;
  protected readonly messageMax = MESSAGE_MAX;

  /** O que está no campo agora; a API só recebe depois de a pessoa parar de digitar. */
  protected readonly searchInput = signal('');
  private readonly search = debounced(this.searchInput);
  protected readonly crnRegion = signal<number | null>(null);
  protected readonly page = signal(1);
  protected readonly nutritionists = nutritionistsResource(
    this.search,
    this.crnRegion,
    this.page,
    PAGE_SIZE,
  );

  /** Para avisar antes de enviar: a API recusa (409) se já houver acompanhamento ou pedido pendente. */
  protected readonly care = careRelationshipResource();
  protected readonly pending = patientRequestsResource(signal('Pending'));
  protected readonly hasActiveCare = computed(() => this.care.hasValue());
  protected readonly pendingByNutritionist = computed(
    () =>
      new Set(
        this.pending.hasValue() ? this.pending.value().items.map((r) => r.nutritionistId) : [],
      ),
  );
  protected readonly hasPendingRequest = computed(() => this.pendingByNutritionist().size > 0);

  protected readonly totalPages = computed(() => {
    const result = this.nutritionists.value();
    return result ? Math.max(1, Math.ceil(result.totalItems / PAGE_SIZE)) : 1;
  });
  protected readonly hasFilters = computed(
    () => !!this.searchInput().trim() || this.crnRegion() !== null,
  );

  protected readonly selected = signal<NutritionistListItem | null>(null);
  protected readonly message = signal('');
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected onSearch(event: Event): void {
    this.searchInput.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected onRegion(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.crnRegion.set(value ? Number(value) : null);
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.searchInput.set('');
    this.crnRegion.set(null);
    this.page.set(1);
  }

  protected goToPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.totalPages()));
  }

  protected openModal(nutritionist: NutritionistListItem): void {
    this.selected.set(nutritionist);
    this.message.set('');
    this.submitError.set(null);
  }

  protected closeModal(): void {
    this.selected.set(null);
  }

  protected onMessage(event: Event): void {
    this.message.set((event.target as HTMLTextAreaElement).value);
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
      this.selected.set(null);
      this.toaster.show(`Solicitação enviada para ${nutritionist.name}.`);
      this.pending.reload();
    } catch (error) {
      this.submitError.set(toApiError(error).message);
    } finally {
      this.submitting.set(false);
    }
  }
}

import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideClock,
  LucideHistory,
  LucideInfo,
  LucideRefreshCw,
  LucideTriangleAlert,
  LucideUserPlus,
  LucideX,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../../core/http/api-error';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { Modal } from '../../../shared/ui/modal/modal';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { PatientApi, patientRequestsResource } from '../patient-api';
import { NutritionistRequestStatus, PatientRequestItem } from '../patient.models';

type RequestFilter = NutritionistRequestStatus | 'All';

const FILTERS: readonly { value: RequestFilter; label: string }[] = [
  { value: 'All', label: 'Todas' },
  { value: 'Pending', label: 'Pendentes' },
  { value: 'Accepted', label: 'Aceitas' },
  { value: 'Rejected', label: 'Recusadas' },
  { value: 'Cancelled', label: 'Canceladas' },
];

export const REQUEST_STATUS_LABELS: Record<NutritionistRequestStatus, string> = {
  Pending: 'Pendente',
  Accepted: 'Aceita',
  Rejected: 'Recusada',
  Cancelled: 'Cancelada',
};

/** Um paciente tem poucas solicitações: carregamos todas (máximo da API) e filtramos na tela. */
const ALL_REQUESTS = 100;

@Component({
  selector: 'app-patient-requests',
  imports: [
    Alert,
    Button,
    DatePipe,
    LoadError,
    LucideClock,
    LucideHistory,
    LucideInfo,
    LucideRefreshCw,
    LucideTriangleAlert,
    LucideUserPlus,
    LucideX,
    Modal,
    PageHeader,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './patient-requests.html',
})
export class PatientRequestsPage {
  private readonly api = inject(PatientApi);
  private readonly toaster = inject(Toaster);

  protected readonly filters = FILTERS;
  protected readonly statusLabels = REQUEST_STATUS_LABELS;
  protected readonly activeFilter = signal<RequestFilter>('All');
  protected readonly requests = patientRequestsResource(signal(null), ALL_REQUESTS);

  private readonly all = computed(() =>
    this.requests.hasValue() ? this.requests.value().items : [],
  );
  protected readonly counts = computed(() => {
    const items = this.all();
    const count = (status: NutritionistRequestStatus) =>
      items.filter((r) => r.status === status).length;
    return {
      All: items.length,
      Pending: count('Pending'),
      Accepted: count('Accepted'),
      Rejected: count('Rejected'),
      Cancelled: count('Cancelled'),
    } satisfies Record<RequestFilter, number>;
  });
  private readonly filtered = computed(() => {
    const filter = this.activeFilter();
    return filter === 'All' ? this.all() : this.all().filter((r) => r.status === filter);
  });
  /** Pendentes em destaque (podem ser canceladas); o resto vai para o histórico. */
  protected readonly pendingItems = computed(() =>
    this.filtered().filter((r) => r.status === 'Pending'),
  );
  protected readonly historyItems = computed(() =>
    this.filtered().filter((r) => r.status !== 'Pending'),
  );

  protected readonly cancelTarget = signal<PatientRequestItem | null>(null);
  protected readonly cancelling = signal(false);
  protected readonly cancelError = signal<string | null>(null);

  protected selectFilter(filter: RequestFilter): void {
    this.activeFilter.set(filter);
  }

  protected openCancel(request: PatientRequestItem): void {
    this.cancelTarget.set(request);
    this.cancelError.set(null);
  }

  protected closeCancel(): void {
    this.cancelTarget.set(null);
  }

  protected async confirmCancel(): Promise<void> {
    const request = this.cancelTarget();
    if (!request || this.cancelling()) {
      return;
    }
    this.cancelling.set(true);
    this.cancelError.set(null);
    try {
      await firstValueFrom(this.api.cancelNutritionistRequest(request.id));
      this.cancelTarget.set(null);
      this.toaster.show('Solicitação cancelada.');
      this.requests.reload();
    } catch (error) {
      // 409: o nutricionista respondeu antes. Recarrega para mostrar a resposta.
      this.cancelError.set(toApiError(error).message);
      this.requests.reload();
    } finally {
      this.cancelling.set(false);
    }
  }

  protected statusClasses(status: NutritionistRequestStatus): string {
    return {
      Pending: 'bg-warning-soft text-warning-ink',
      Accepted: 'bg-success-soft text-success-ink',
      Rejected: 'bg-danger-soft text-danger-ink',
      Cancelled: 'bg-surface-muted text-ink-muted',
    }[status];
  }
}

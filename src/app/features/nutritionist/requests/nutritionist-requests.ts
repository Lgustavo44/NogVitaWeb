import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  LucideCheck,
  LucideClock,
  LucideInbox,
  LucideRefreshCw,
  LucideTriangleAlert,
  LucideUserRound,
  LucideX,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../../core/http/api-error';
import { Button } from '../../../shared/ui/button/button';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { Modal } from '../../../shared/ui/modal/modal';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { NutritionistApi, nutritionistRequestsResource } from '../nutritionist-api';
import { NutritionistRequestItem, RequestStatus } from '../nutritionist.models';

type RequestFilter = RequestStatus | 'All';
type RequestAction = 'accept' | 'reject';

const FILTERS: readonly { value: RequestFilter; label: string }[] = [
  { value: 'Pending', label: 'Pendentes' },
  { value: 'Accepted', label: 'Aceitas' },
  { value: 'Rejected', label: 'Recusadas' },
  { value: 'Cancelled', label: 'Canceladas' },
  { value: 'All', label: 'Todas' },
];

const STATUS_LABELS: Record<RequestStatus, string> = {
  Pending: 'Pendente de avaliação',
  Accepted: 'Aceita',
  Rejected: 'Recusada',
  Cancelled: 'Cancelada pelo paciente',
};

@Component({
  selector: 'app-nutritionist-requests',
  imports: [
    Button,
    DatePipe,
    LoadError,
    LucideCheck,
    LucideClock,
    LucideInbox,
    LucideRefreshCw,
    LucideTriangleAlert,
    LucideUserRound,
    LucideX,
    Modal,
    PageHeader,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './nutritionist-requests.html',
})
export class NutritionistRequestsPage {
  private readonly api = inject(NutritionistApi);
  private readonly toaster = inject(Toaster);

  protected readonly filters = FILTERS;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly activeFilter = signal<RequestFilter>('Pending');
  protected readonly requests = nutritionistRequestsResource(signal(null), 100);
  protected readonly actionId = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly rejectTarget = signal<NutritionistRequestItem | null>(null);

  private readonly all = computed(() =>
    this.requests.hasValue() ? this.requests.value().items : [],
  );
  protected readonly counts = computed(() => {
    const items = this.all();
    const count = (status: RequestStatus) => items.filter((item) => item.status === status).length;
    return {
      All: items.length,
      Pending: count('Pending'),
      Accepted: count('Accepted'),
      Rejected: count('Rejected'),
      Cancelled: count('Cancelled'),
    } satisfies Record<RequestFilter, number>;
  });
  protected readonly filtered = computed(() => {
    const filter = this.activeFilter();
    return filter === 'All' ? this.all() : this.all().filter((item) => item.status === filter);
  });

  protected selectFilter(filter: RequestFilter): void {
    this.activeFilter.set(filter);
  }

  protected openReject(request: NutritionistRequestItem): void {
    this.actionError.set(null);
    this.rejectTarget.set(request);
  }

  protected closeReject(): void {
    if (!this.actionId()) {
      this.rejectTarget.set(null);
    }
  }

  protected accept(request: NutritionistRequestItem): void {
    void this.respond(request, 'accept');
  }

  protected async confirmReject(): Promise<void> {
    const request = this.rejectTarget();
    if (request) {
      await this.respond(request, 'reject');
    }
  }

  private async respond(request: NutritionistRequestItem, action: RequestAction): Promise<void> {
    if (this.actionId()) {
      return;
    }
    this.actionId.set(request.id);
    this.actionError.set(null);
    try {
      const response =
        action === 'accept'
          ? this.api.acceptRequest(request.id)
          : this.api.rejectRequest(request.id);
      await firstValueFrom(response);
      this.rejectTarget.set(null);
      this.toaster.show(
        action === 'accept'
          ? `${request.patientName} agora está entre os seus pacientes.`
          : `Solicitação de ${request.patientName} recusada.`,
      );
      this.requests.reload();
    } catch (error) {
      this.actionError.set(toApiError(error).message);
      this.requests.reload();
    } finally {
      this.actionId.set(null);
    }
  }

  protected statusClasses(status: RequestStatus): string {
    return {
      Pending: 'bg-warning-soft text-warning-ink',
      Accepted: 'bg-success-soft text-success-ink',
      Rejected: 'bg-danger-soft text-danger-ink',
      Cancelled: 'bg-surface-muted text-ink-muted',
    }[status];
  }

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts.at(-1)?.[0] ?? '')).toUpperCase();
  }
}

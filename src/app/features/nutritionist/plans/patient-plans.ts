import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideChevronRight, LucideClipboardList, LucidePlus } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { errorSummary } from '../../../core/http/api-error';
import { PlanRequest } from '../../../shared/domain/nutrition-plan';
import { PlanStatusBadge } from '../../../shared/plan/plan-status-badge';
import { Button } from '../../../shared/ui/button/button';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { parseIsoDate } from '../../../shared/util/dates';
import { PlanFormModal } from './plan-form-modal';
import { PlansApi, patientPlansResource } from './plans-api';

/** Planos que você criou para um paciente, com o botão de criar um novo rascunho. */
@Component({
  selector: 'app-patient-plans',
  imports: [
    Button,
    DatePipe,
    LoadError,
    LucideChevronRight,
    LucideClipboardList,
    LucidePlus,
    PlanFormModal,
    PlanStatusBadge,
    RouterLink,
  ],
  template: `
    <section
      class="flex flex-col gap-4 rounded-container bg-surface p-5 shadow-1"
      aria-labelledby="planos-titulo"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 id="planos-titulo" class="flex items-center gap-2 text-title-md text-ink">
          <svg lucideClipboardList class="size-5 text-link"></svg>
          {{ heading() }}
        </h2>
        <button appButton type="button" (click)="openForm()">
          <svg lucidePlus class="size-5"></svg>
          Novo plano
        </button>
      </div>

      @if (plans.hasValue()) {
        @if (plans.value().items.length === 0) {
          <p class="rounded-control bg-surface-muted p-4 text-body-md text-ink-muted">
            Nenhum plano ainda. Crie um rascunho, monte as refeições e ative quando estiver pronto.
          </p>
        } @else {
          @if (!hasActive()) {
            <p class="text-body-sm text-ink-muted">O paciente está sem plano ativo agora.</p>
          }
          <ul class="flex flex-col divide-y divide-divider">
            @for (plan of plans.value().items; track plan.id) {
              <li>
                <a
                  [routerLink]="['/nutricionista/planos', plan.id]"
                  class="flex items-center gap-3 rounded-control px-2 py-3 hover:bg-surface-muted"
                >
                  <span class="flex min-w-0 flex-1 flex-col gap-1">
                    <span class="flex flex-wrap items-center gap-2">
                      <span class="text-label-lg text-ink">{{ plan.name }}</span>
                      <app-plan-status-badge [status]="plan.status" />
                    </span>
                    <span class="text-body-sm text-ink-muted">
                      {{ date(plan.startDate) | date: 'dd/MM/yyyy' }}
                      @if (plan.endDate) {
                        a {{ date(plan.endDate) | date: 'dd/MM/yyyy' }}
                      } @else {
                        · sem data de término
                      }
                    </span>
                  </span>
                  <svg lucideChevronRight class="size-5 shrink-0 text-ink-muted"></svg>
                </a>
              </li>
            }
          </ul>
        }
      } @else if (plans.error()) {
        <app-load-error [error]="plans.error()" (retry)="plans.reload()" />
      } @else {
        <div class="flex flex-col gap-2" aria-hidden="true">
          @for (row of [1, 2]; track row) {
            <div class="h-14 rounded-control bg-surface-muted motion-safe:animate-pulse"></div>
          }
        </div>
        <span class="sr-only" role="status">Carregando planos…</span>
      }
    </section>

    @if (formOpen()) {
      <app-plan-form-modal
        [busy]="saving()"
        [error]="saveError()"
        (saved)="create($event)"
        (closed)="closeForm()"
      />
    }
  `,
})
export class PatientPlans {
  private readonly api = inject(PlansApi);
  private readonly router = inject(Router);
  private readonly toaster = inject(Toaster);

  readonly patientId = input.required<string>();
  readonly heading = input('Planos alimentares');

  protected readonly plans = patientPlansResource(this.patientId);
  protected readonly hasActive = computed(
    () =>
      this.plans.hasValue() && this.plans.value().items.some((plan) => plan.status === 'Active'),
  );
  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  protected date(iso: string): Date {
    return parseIsoDate(iso);
  }

  protected openForm(): void {
    this.saveError.set(null);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    if (!this.saving()) this.formOpen.set(false);
  }

  /** Cria o rascunho e abre o editor para montar as refeições. */
  protected async create(body: PlanRequest): Promise<void> {
    this.saving.set(true);
    this.saveError.set(null);
    try {
      const id = await firstValueFrom(this.api.create(this.patientId(), body));
      this.formOpen.set(false);
      this.toaster.show('Rascunho criado. Agora monte as refeições.');
      await this.router.navigate(['/nutricionista/planos', id]);
    } catch (error) {
      this.saveError.set(errorSummary(error));
    } finally {
      this.saving.set(false);
    }
  }
}

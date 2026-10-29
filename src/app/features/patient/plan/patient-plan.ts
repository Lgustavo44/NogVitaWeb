import { DatePipe } from '@angular/common';
import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronRight, LucideClipboardList, LucideUtensils } from '@lucide/angular';
import { isNotFound } from '../../../core/http/resource-status';
import { PlanStatusBadge } from '../../../shared/plan/plan-status-badge';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { parseIsoDate } from '../../../shared/util/dates';
import { currentPlanResource, patientPlansResource } from '../patient-api';
import { PatientPlanView } from './patient-plan-view';

/** Plano ativo (ou o estado vazio, que é normal) e os planos anteriores. */
@Component({
  selector: 'app-patient-plan',
  imports: [
    DatePipe,
    LoadError,
    LucideChevronRight,
    LucideClipboardList,
    LucideUtensils,
    PageHeader,
    PatientPlanView,
    PlanStatusBadge,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  template: `
    @if (current.hasValue()) {
      <app-patient-plan-view [detail]="current.value()" />
    } @else if (withoutPlan()) {
      <app-page-header
        badge="Plano alimentar"
        title="Plano alimentar"
        subtitle="O plano que seu nutricionista montou para você aparece aqui."
      />
      <section
        class="flex flex-col items-center gap-3 rounded-container bg-surface p-8 text-center shadow-1"
      >
        <svg lucideUtensils class="size-10 text-ink-muted"></svg>
        <h2 class="text-title-md text-ink">Você ainda não tem um plano ativo</h2>
        <p class="max-w-md text-body-md text-ink-muted">
          Quando seu nutricionista ativar um plano, ele aparece aqui, com as refeições e o PDF para
          baixar. Ainda sem nutricionista?
          <a routerLink="/paciente/encontrar-nutricionista" class="text-link underline"
            >Encontre um</a
          >.
        </p>
      </section>
    } @else if (current.error()) {
      <app-load-error [error]="current.error()" (retry)="current.reload()" />
    } @else {
      <div
        class="h-64 rounded-container bg-surface-muted motion-safe:animate-pulse"
        aria-hidden="true"
      ></div>
      <span class="sr-only" role="status">Carregando seu plano…</span>
    }

    @if (previous().length > 0) {
      <section
        class="flex flex-col gap-3 rounded-container bg-surface p-5 shadow-1"
        aria-labelledby="anteriores-titulo"
      >
        <h2 id="anteriores-titulo" class="flex items-center gap-2 text-title-md text-ink">
          <svg lucideClipboardList class="size-5 text-link"></svg>
          Planos anteriores
        </h2>
        <ul class="flex flex-col divide-y divide-divider">
          @for (plan of previous(); track plan.id) {
            <li>
              <a
                [routerLink]="['/paciente/plano', plan.id]"
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
                    }
                    · por {{ plan.nutritionistName }}
                  </span>
                </span>
                <svg lucideChevronRight class="size-5 shrink-0 text-ink-muted"></svg>
              </a>
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class PatientPlanPage {
  protected readonly current = currentPlanResource();
  /** 404 "Você não tem um plano ativo." é o estado normal de quem ainda não recebeu plano. */
  protected readonly withoutPlan = computed(() => isNotFound(this.current.error()));

  private readonly plans = patientPlansResource();
  /** O histórico: tudo menos o plano ativo (que já está na tela). */
  protected readonly previous = computed(() =>
    this.plans.hasValue()
      ? this.plans.value().items.filter((plan) => plan.status !== 'Active')
      : [],
  );

  protected date(iso: string): Date {
    return parseIsoDate(iso);
  }
}

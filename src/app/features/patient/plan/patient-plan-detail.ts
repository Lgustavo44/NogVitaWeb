import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { patientPlanResource } from '../patient-api';
import { PatientPlanView } from './patient-plan-view';

/** Um plano do histórico (ativo ou finalizado). */
@Component({
  selector: 'app-patient-plan-detail',
  imports: [LoadError, LucideArrowLeft, PatientPlanView, RouterLink],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <a
      routerLink="/paciente/plano"
      class="inline-flex items-center gap-2 self-start text-label-lg text-link hover:underline"
    >
      <svg lucideArrowLeft class="size-4"></svg>
      Voltar para o plano atual
    </a>
    @if (plan.hasValue()) {
      <app-patient-plan-view [detail]="plan.value()" />
    } @else if (plan.error()) {
      <app-load-error [error]="plan.error()" (retry)="plan.reload()" />
    } @else {
      <div
        class="h-64 rounded-container bg-surface-muted motion-safe:animate-pulse"
        aria-hidden="true"
      ></div>
      <span class="sr-only" role="status">Carregando plano…</span>
    }
  `,
})
export class PatientPlanDetailPage {
  protected readonly plan = patientPlanResource(
    signal(inject(ActivatedRoute).snapshot.paramMap.get('planId')),
  );
}

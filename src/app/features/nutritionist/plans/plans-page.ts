import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideUsers } from '@lucide/angular';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { myPatientsResource } from '../nutritionist-api';
import { PatientPlans } from './patient-plans';

/** Máximo da API por página; a lista de pacientes em acompanhamento cabe numa página. */
const PATIENTS_PAGE = 100;

/**
 * Entrada do menu "Planos alimentares". A API lista planos por paciente (não há lista geral),
 * então a tela pede o paciente primeiro. O paciente escolhido fica na URL (`?paciente=`).
 */
@Component({
  selector: 'app-plans-page',
  imports: [LoadError, LucideUsers, PageHeader, PatientPlans, RouterLink],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <app-page-header
      badge="Planos alimentares"
      title="Planos alimentares"
      subtitle="Escolha o paciente para ver os planos ou criar um novo."
    />

    @if (patients.hasValue()) {
      @if (patients.value().items.length === 0) {
        <section
          class="flex flex-col items-center gap-3 rounded-container bg-surface p-8 text-center shadow-1"
        >
          <svg lucideUsers class="size-10 text-ink-muted"></svg>
          <h2 class="text-title-md text-ink">Nenhum paciente em acompanhamento</h2>
          <p class="max-w-md text-body-md text-ink-muted">
            Os planos são criados para pacientes que você acompanha. Veja as
            <a routerLink="/nutricionista/solicitacoes" class="text-link underline">solicitações</a>
            pendentes.
          </p>
        </section>
      } @else {
        <section class="flex flex-col gap-2 rounded-container bg-surface p-5 shadow-1">
          <label for="paciente-plano" class="text-label-md text-ink">Paciente</label>
          <select
            id="paciente-plano"
            class="h-11 w-full rounded-control border border-line bg-surface px-3 text-body-lg text-ink focus:border-focus focus:ring-4 focus:ring-primary/20 focus:outline-none sm:max-w-md"
            [value]="patientId() ?? ''"
            (change)="choose($event)"
          >
            <option value="" disabled>Escolha um paciente</option>
            @for (patient of patients.value().items; track patient.patientId) {
              <option [value]="patient.patientId">{{ patient.name }}</option>
            }
          </select>
        </section>

        @if (selected(); as patient) {
          <app-patient-plans
            [patientId]="patient.patientId"
            [heading]="'Planos de ' + patient.name"
          />
        }
      }
    } @else if (patients.error()) {
      <app-load-error [error]="patients.error()" (retry)="patients.reload()" />
    } @else {
      <div
        class="h-24 rounded-container bg-surface-muted motion-safe:animate-pulse"
        aria-hidden="true"
      ></div>
      <span class="sr-only" role="status">Carregando pacientes…</span>
    }
  `,
})
export class PlansPage {
  private readonly router = inject(Router);

  protected readonly patients = myPatientsResource(signal(''), signal(1), PATIENTS_PAGE);
  protected readonly patientId = signal(
    inject(ActivatedRoute).snapshot.queryParamMap.get('paciente'),
  );
  protected readonly selected = computed(() => {
    const id = this.patientId();
    return this.patients.hasValue()
      ? (this.patients.value().items.find((patient) => patient.patientId === id) ?? null)
      : null;
  });

  constructor() {
    effect(() => {
      void this.router.navigate([], {
        queryParams: { paciente: this.patientId() },
        replaceUrl: true,
      });
    });
  }

  protected choose(event: Event): void {
    this.patientId.set((event.target as HTMLSelectElement).value || null);
  }
}

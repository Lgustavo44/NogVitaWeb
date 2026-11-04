import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideClipboardPen } from '@lucide/angular';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { myAnamnesesResource } from './patient-anamnesis-api';

/** As anamneses que o nutricionista enviou: responder as pendentes e rever as respondidas. */
@Component({
  selector: 'app-patient-anamneses-page',
  imports: [DatePipe, LoadError, LucideClipboardPen, PageHeader, RouterLink],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <app-page-header
      title="Anamnese"
      subtitle="As perguntas que o seu nutricionista enviou para conhecer você antes da consulta."
    />

    @if (anamneses.isLoading() && !anamneses.hasValue()) {
      <div
        class="h-40 rounded-container bg-surface-muted motion-safe:animate-pulse"
        aria-hidden="true"
      ></div>
      <span class="sr-only" role="status">Carregando anamneses…</span>
    } @else if (anamneses.error()) {
      <app-load-error [error]="anamneses.error()" (retry)="anamneses.reload()" />
    } @else if (anamneses.hasValue() && anamneses.value().items.length === 0) {
      <section
        class="flex flex-col items-center gap-3 rounded-container bg-surface p-10 text-center shadow-1"
      >
        <svg lucideClipboardPen class="size-10 text-ink-muted"></svg>
        <h2 class="text-title-md text-ink">Nenhuma anamnese por enquanto</h2>
        <p class="max-w-md text-body-md text-ink-muted">
          Quando o seu nutricionista enviar as perguntas, elas aparecem aqui.
        </p>
      </section>
    } @else if (anamneses.hasValue()) {
      <ul class="flex flex-col gap-3">
        @for (item of anamneses.value().items; track item.id) {
          <li class="flex flex-wrap items-center gap-3 rounded-container bg-surface p-5 shadow-1">
            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <h2 class="text-title-md text-ink">{{ item.title }}</h2>
              <p class="text-body-sm text-ink-muted">
                De {{ item.nutritionistName }} · enviada em {{ item.sentAt | date: 'dd/MM/yyyy' }}
                @if (item.submittedAt; as submittedAt) {
                  · respondida em {{ submittedAt | date: 'dd/MM/yyyy' }}
                }
              </p>
            </div>
            @if (item.status === 'Pending') {
              <a
                [routerLink]="['/paciente/anamneses', item.id]"
                class="inline-flex min-h-11 items-center rounded-control bg-primary px-5 text-label-lg font-semibold text-on-primary hover:bg-primary-hover"
                >Responder<span class="sr-only"> {{ item.title }}</span></a
              >
            } @else {
              <a
                [routerLink]="['/paciente/anamneses', item.id]"
                class="text-label-lg font-semibold text-link hover:underline"
                >Ver respostas<span class="sr-only"> de {{ item.title }}</span></a
              >
            }
          </li>
        }
      </ul>
    }
  `,
})
export class PatientAnamnesesPage {
  protected readonly anamneses = myAnamnesesResource();
}

import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { AnamnesisAnswers } from '../../../shared/anamnesis/anamnesis-answers';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { anamnesisResource } from './anamnesis-api';

/** Uma anamnese enviada a um paciente, com as respostas (só leitura). */
@Component({
  selector: 'app-anamnesis-page',
  imports: [AnamnesisAnswers, LoadError, LucideArrowLeft, RouterLink],
  host: { class: 'flex flex-col gap-6' },
  template: `
    @if (anamnesis.hasValue()) {
      <a
        [routerLink]="['/nutricionista/pacientes', anamnesis.value().patientId]"
        class="inline-flex items-center gap-2 self-start text-label-lg text-link hover:underline"
      >
        <svg lucideArrowLeft class="size-4"></svg>
        Voltar para {{ anamnesis.value().patientName }}
      </a>
      <app-anamnesis-answers [anamnesis]="anamnesis.value()" />
    } @else if (anamnesis.error()) {
      <app-load-error [error]="anamnesis.error()" (retry)="anamnesis.reload()" />
    } @else {
      <div
        class="h-64 rounded-container bg-surface-muted motion-safe:animate-pulse"
        aria-hidden="true"
      ></div>
      <span class="sr-only" role="status">Carregando anamnese…</span>
    }
  `,
})
export class AnamnesisPage {
  protected readonly anamnesis = anamnesisResource(
    signal(inject(ActivatedRoute).snapshot.paramMap.get('anamnesisId') ?? ''),
  );
}

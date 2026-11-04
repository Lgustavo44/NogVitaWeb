import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideClipboardPen, LucideSend } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../../core/http/api-error';
import { ANAMNESIS_STATUS_LABELS } from '../../../shared/anamnesis/anamnesis.models';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { Modal } from '../../../shared/ui/modal/modal';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { AnamnesisApi, patientAnamnesesResource, questionnairesResource } from './anamnesis-api';

/** As anamneses do paciente no detalhe dele: enviar um questionário e ver as respostas. */
@Component({
  selector: 'app-patient-anamneses',
  imports: [Alert, Button, DatePipe, LoadError, LucideClipboardPen, LucideSend, Modal, RouterLink],
  host: { class: 'flex flex-col gap-4' },
  template: `
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="flex items-center gap-2 text-title-md text-ink">
        <svg lucideClipboardPen class="size-5 text-link"></svg>
        Anamnese
      </h2>
      <button appButton variant="soft" type="button" (click)="openSend()">
        <svg lucideSend class="size-5"></svg>
        Enviar anamnese
      </button>
    </div>

    @if (anamneses.isLoading() && !anamneses.hasValue()) {
      <div
        class="h-24 rounded-container bg-surface-muted motion-safe:animate-pulse"
        aria-hidden="true"
      ></div>
    } @else if (anamneses.error()) {
      <app-load-error [error]="anamneses.error()" (retry)="anamneses.reload()" />
    } @else if (anamneses.hasValue() && anamneses.value().items.length === 0) {
      <p class="rounded-container bg-surface p-5 text-body-md text-ink-muted shadow-1">
        Nenhuma anamnese enviada. O paciente responde antes da consulta, e as respostas aparecem
        aqui.
      </p>
    } @else if (anamneses.hasValue()) {
      <ul class="flex flex-col divide-y divide-divider rounded-container bg-surface px-5 shadow-1">
        @for (item of anamneses.value().items; track item.id) {
          <li class="flex flex-wrap items-center gap-3 py-3">
            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <a
                [routerLink]="['/nutricionista/anamneses', item.id]"
                class="text-label-lg text-ink hover:underline"
              >
                {{ item.title }}
              </a>
              <p class="text-body-sm text-ink-muted">
                Enviada em {{ item.sentAt | date: 'dd/MM/yyyy' }}
                @if (item.submittedAt; as submittedAt) {
                  · respondida em {{ submittedAt | date: 'dd/MM/yyyy' }}
                }
              </p>
            </div>
            <span
              class="rounded-pill px-2.5 py-0.5 text-label-md"
              [class]="
                item.status === 'Submitted'
                  ? 'bg-success-soft text-success-ink'
                  : 'bg-warning-soft text-warning-ink'
              "
              >{{ statusLabels[item.status] }}</span
            >
          </li>
        }
      </ul>
    }

    @if (sending()) {
      <app-modal
        heading="Enviar anamnese"
        subtitle="O paciente responde pela área dele, antes da consulta."
        size="sm"
        [busy]="busy()"
        (closed)="closeSend()"
      >
        @if (questionnaires.hasValue() && questionnaires.value().items.length === 0) {
          <p class="text-body-md text-ink">
            Você ainda não tem questionários.
            <a
              routerLink="/nutricionista/questionarios/novo"
              class="font-medium text-link underline"
              >Crie o primeiro</a
            >, a partir do modelo base.
          </p>
        } @else {
          <div class="flex flex-col gap-1.5">
            <label for="questionario-envio" class="text-label-md text-ink">Questionário</label>
            <select
              id="questionario-envio"
              class="h-11 w-full cursor-pointer rounded-control border border-line bg-surface px-3 text-body-lg text-ink focus:border-focus focus:ring-4 focus:ring-primary/20 focus:outline-none"
              (change)="questionnaireId.set($any($event.target).value)"
            >
              <option value="" [selected]="!questionnaireId()" disabled>
                Escolha o questionário
              </option>
              @for (item of questionnaires.value()?.items ?? []; track item.id) {
                <option [value]="item.id" [selected]="item.id === questionnaireId()">
                  {{ item.title }}
                </option>
              }
            </select>
          </div>
        }
        @if (error(); as message) {
          <app-alert tone="danger">{{ message }}</app-alert>
        }
        <ng-container modalActions>
          <button appButton variant="soft" type="button" [disabled]="busy()" (click)="closeSend()">
            Cancelar
          </button>
          <button
            appButton
            type="button"
            [loading]="busy()"
            [disabled]="!questionnaireId()"
            (click)="send()"
          >
            <svg lucideSend class="size-5"></svg>
            Enviar
          </button>
        </ng-container>
      </app-modal>
    }
  `,
})
export class PatientAnamneses {
  private readonly api = inject(AnamnesisApi);
  private readonly toaster = inject(Toaster);

  readonly patientId = input.required<string>();

  protected readonly statusLabels = ANAMNESIS_STATUS_LABELS;
  protected readonly anamneses = patientAnamnesesResource(this.patientId);
  protected readonly sending = signal(false);
  /** Os questionários só são buscados quando o envio abre. */
  protected readonly questionnaires = questionnairesResource(computed(() => this.sending()));
  protected readonly questionnaireId = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected openSend(): void {
    this.error.set(null);
    this.questionnaireId.set('');
    this.sending.set(true);
  }

  protected closeSend(): void {
    if (!this.busy()) this.sending.set(false);
  }

  protected async send(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.api.send(this.patientId(), this.questionnaireId()));
      this.sending.set(false);
      this.toaster.show('Anamnese enviada ao paciente.');
      this.anamneses.reload();
    } catch (error) {
      this.error.set(toApiError(error).message);
    } finally {
      this.busy.set(false);
    }
  }
}

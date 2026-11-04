import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideClipboardPen, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../../core/http/api-error';
import { QuestionnaireSummary } from '../../../shared/anamnesis/anamnesis.models';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { AnamnesisApi, questionnairesResource } from './anamnesis-api';

/** Os questionários de anamnese do nutricionista: criar, editar e apagar. */
@Component({
  selector: 'app-questionnaires-page',
  imports: [
    ConfirmDialog,
    DatePipe,
    LoadError,
    LucideClipboardPen,
    LucidePlus,
    LucideTrash2,
    PageHeader,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <app-page-header
      title="Questionários de anamnese"
      subtitle="Monte as perguntas que o paciente responde antes da consulta e envie pelo detalhe do paciente."
    >
      <a
        routerLink="/nutricionista/questionarios/novo"
        class="inline-flex min-h-11 items-center gap-2 rounded-control bg-primary px-5 text-label-lg font-semibold text-on-primary hover:bg-primary-hover"
      >
        <svg lucidePlus class="size-5"></svg>
        Novo questionário
      </a>
    </app-page-header>

    @if (questionnaires.isLoading() && !questionnaires.hasValue()) {
      <div
        class="h-40 rounded-container bg-surface-muted motion-safe:animate-pulse"
        aria-hidden="true"
      ></div>
      <span class="sr-only" role="status">Carregando questionários…</span>
    } @else if (questionnaires.error()) {
      <app-load-error [error]="questionnaires.error()" (retry)="questionnaires.reload()" />
    } @else if (questionnaires.hasValue() && questionnaires.value().items.length === 0) {
      <section
        class="flex flex-col items-center gap-3 rounded-container bg-surface p-10 text-center shadow-1"
      >
        <svg lucideClipboardPen class="size-10 text-ink-muted"></svg>
        <h2 class="text-title-md text-ink">Nenhum questionário ainda</h2>
        <p class="max-w-md text-body-md text-ink-muted">
          Comece pelo modelo base, com as perguntas mais comuns da primeira consulta, e ajuste ao
          seu jeito.
        </p>
      </section>
    } @else if (questionnaires.hasValue()) {
      <ul class="flex flex-col divide-y divide-divider rounded-container bg-surface px-5 shadow-1">
        @for (item of questionnaires.value().items; track item.id) {
          <li class="flex flex-wrap items-center gap-3 py-4">
            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <a
                [routerLink]="['/nutricionista/questionarios', item.id]"
                class="text-title-md text-ink hover:underline"
                >{{ item.title }}</a
              >
              <p class="text-body-sm text-ink-muted">
                {{ item.questionCount }} {{ item.questionCount === 1 ? 'pergunta' : 'perguntas' }} ·
                atualizado em {{ item.updatedAt | date: 'dd/MM/yyyy' }}
              </p>
            </div>
            <button
              type="button"
              class="inline-flex size-10 cursor-pointer items-center justify-center rounded-control text-danger-ink hover:bg-danger-soft"
              [attr.aria-label]="'Apagar ' + item.title"
              (click)="deleteTarget.set(item)"
            >
              <svg lucideTrash2 class="size-5"></svg>
            </button>
          </li>
        }
      </ul>
    }

    @if (deleteTarget(); as item) {
      <app-confirm-dialog
        heading="Apagar este questionário?"
        [subtitle]="item.title"
        confirmLabel="Apagar"
        tone="danger"
        [busy]="deleting()"
        [error]="deleteError()"
        (confirmed)="confirmDelete(item)"
        (closed)="closeDelete()"
      >
        <p>As anamneses que você já enviou com ele continuam como estão.</p>
      </app-confirm-dialog>
    }
  `,
})
export class QuestionnairesPage {
  private readonly api = inject(AnamnesisApi);
  private readonly toaster = inject(Toaster);

  protected readonly questionnaires = questionnairesResource();
  protected readonly deleteTarget = signal<QuestionnaireSummary | null>(null);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  protected async confirmDelete(item: QuestionnaireSummary): Promise<void> {
    this.deleting.set(true);
    this.deleteError.set(null);
    try {
      await firstValueFrom(this.api.delete(item.id));
      this.deleteTarget.set(null);
      this.toaster.show('Questionário apagado.');
      this.questionnaires.reload();
    } catch (error) {
      this.deleteError.set(toApiError(error).message);
    } finally {
      this.deleting.set(false);
    }
  }

  protected closeDelete(): void {
    if (!this.deleting()) {
      this.deleteTarget.set(null);
      this.deleteError.set(null);
    }
  }
}

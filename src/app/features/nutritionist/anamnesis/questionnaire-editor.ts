import { Component, inject, linkedSignal, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowDown,
  LucideArrowLeft,
  LucideArrowUp,
  LucideFilePlus,
  LucidePlus,
  LucideTrash2,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { errorSummary } from '../../../core/http/api-error';
import {
  QUESTION_TYPE_LABELS,
  QuestionDraft,
  QuestionType,
  hasOptions,
  toQuestionDraft,
  toQuestionnaireRequest,
} from '../../../shared/anamnesis/anamnesis.models';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { AnamnesisApi, questionnaireResource } from './anamnesis-api';

const CONTROL =
  'w-full rounded-control border border-line bg-surface px-3 text-body-lg text-ink ' +
  'placeholder:text-ink-muted/70 focus:border-focus focus:ring-4 focus:ring-primary/20 focus:outline-none';

/** Criar ou editar um questionário. As regras (limites, opções) são da API, que devolve as mensagens. */
@Component({
  selector: 'app-questionnaire-editor',
  imports: [
    Alert,
    Button,
    LoadError,
    LucideArrowDown,
    LucideArrowLeft,
    LucideArrowUp,
    LucideFilePlus,
    LucidePlus,
    LucideTrash2,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <a
      routerLink="/nutricionista/questionarios"
      class="inline-flex items-center gap-2 self-start text-label-lg text-link hover:underline"
    >
      <svg lucideArrowLeft class="size-4"></svg>
      Voltar para os questionários
    </a>

    @if (loaded.error()) {
      <app-load-error [error]="loaded.error()" (retry)="loaded.reload()" />
    } @else if (id && !loaded.hasValue()) {
      <div
        class="h-64 rounded-container bg-surface-muted motion-safe:animate-pulse"
        aria-hidden="true"
      ></div>
      <span class="sr-only" role="status">Carregando questionário…</span>
    } @else {
      <form class="flex flex-col gap-6" (submit)="save($event)">
        <div class="flex flex-col gap-3">
          <h1 class="text-headline-xl text-ink">
            {{ id ? 'Editar questionário' : 'Novo questionário' }}
          </h1>
          <div class="flex flex-wrap items-center gap-3">
            <button
              appButton
              variant="outline"
              type="button"
              [loading]="loadingTemplate()"
              (click)="useTemplate()"
            >
              <svg lucideFilePlus class="size-5"></svg>
              Usar o modelo base
            </button>
            <p class="text-body-sm text-ink-muted">
              Troca as perguntas atuais pelas mais comuns da primeira consulta.
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-1.5 sm:max-w-xl">
          <label for="questionario-titulo" class="text-label-md text-ink">Título</label>
          <input
            id="questionario-titulo"
            [class]="control + ' h-11'"
            maxlength="100"
            required
            placeholder="Ex.: Primeira consulta"
            [value]="title()"
            (input)="title.set(value($event))"
          />
        </div>

        <ol class="flex flex-col gap-4">
          @for (
            question of questions();
            track $index;
            let index = $index, first = $first, last = $last
          ) {
            <li>
              <fieldset
                class="flex flex-col gap-3 rounded-container bg-surface p-4 shadow-1 sm:p-5"
              >
                <legend class="sr-only">Pergunta {{ index + 1 }}</legend>
                <div class="flex items-center gap-2">
                  <p class="flex-1 text-label-lg text-ink" aria-hidden="true">
                    Pergunta {{ index + 1 }}
                  </p>
                  <button
                    type="button"
                    class="inline-flex size-10 cursor-pointer items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                    [attr.aria-label]="'Subir a pergunta ' + (index + 1)"
                    [disabled]="first"
                    (click)="move(index, -1)"
                  >
                    <svg lucideArrowUp class="size-5"></svg>
                  </button>
                  <button
                    type="button"
                    class="inline-flex size-10 cursor-pointer items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                    [attr.aria-label]="'Descer a pergunta ' + (index + 1)"
                    [disabled]="last"
                    (click)="move(index, 1)"
                  >
                    <svg lucideArrowDown class="size-5"></svg>
                  </button>
                  <button
                    type="button"
                    class="inline-flex size-10 cursor-pointer items-center justify-center rounded-control text-danger-ink hover:bg-danger-soft"
                    [attr.aria-label]="'Remover a pergunta ' + (index + 1)"
                    (click)="remove(index)"
                  >
                    <svg lucideTrash2 class="size-5"></svg>
                  </button>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label [for]="'pergunta-' + index" class="text-label-md text-ink"
                    >Texto da pergunta</label
                  >
                  <textarea
                    [id]="'pergunta-' + index"
                    [class]="control + ' py-2'"
                    rows="2"
                    maxlength="500"
                    required
                    [value]="question.text"
                    (input)="patch(index, { text: value($event) })"
                  ></textarea>
                </div>

                <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div class="flex flex-col gap-1.5 sm:w-64">
                    <label [for]="'tipo-' + index" class="text-label-md text-ink"
                      >Tipo de resposta</label
                    >
                    <select
                      [id]="'tipo-' + index"
                      [class]="control + ' h-11 cursor-pointer'"
                      (change)="patch(index, { type: $any(value($event)) })"
                    >
                      @for (type of types; track type) {
                        <option [value]="type" [selected]="type === question.type">
                          {{ typeLabels[type] }}
                        </option>
                      }
                    </select>
                  </div>
                  <label
                    class="flex min-h-11 cursor-pointer items-center gap-2 text-label-lg text-ink"
                  >
                    <input
                      type="checkbox"
                      class="size-5 cursor-pointer accent-primary"
                      [checked]="question.required"
                      (change)="patch(index, { required: checked($event) })"
                    />
                    Obrigatória
                  </label>
                </div>

                @if (hasOptions(question.type)) {
                  <div class="flex flex-col gap-1.5">
                    <label [for]="'opcoes-' + index" class="text-label-md text-ink"
                      >Opções, uma por linha</label
                    >
                    <textarea
                      [id]="'opcoes-' + index"
                      [class]="control + ' py-2'"
                      rows="4"
                      [attr.aria-describedby]="'opcoes-dica-' + index"
                      [value]="question.optionsText"
                      (input)="patch(index, { optionsText: value($event) })"
                    ></textarea>
                    <p [id]="'opcoes-dica-' + index" class="text-body-sm text-ink-muted">
                      De 2 a 20 opções, sem repetir.
                    </p>
                  </div>
                }
              </fieldset>
            </li>
          }
        </ol>

        <button appButton variant="soft" type="button" class="self-start" (click)="add()">
          <svg lucidePlus class="size-5"></svg>
          Adicionar pergunta
        </button>

        @if (error(); as message) {
          <app-alert tone="danger">{{ message }}</app-alert>
        }

        <div class="flex gap-2 border-t border-divider pt-5">
          <a
            routerLink="/nutricionista/questionarios"
            class="inline-flex min-h-11 items-center rounded-control bg-soft/30 px-5 text-label-lg font-semibold text-soft-ink hover:bg-soft/50"
            >Cancelar</a
          >
          <button appButton type="submit" [loading]="saving()">Salvar questionário</button>
        </div>
      </form>
    }
  `,
})
export class QuestionnaireEditorPage {
  private readonly api = inject(AnamnesisApi);
  private readonly router = inject(Router);
  private readonly toaster = inject(Toaster);

  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('questionnaireId');
  protected readonly loaded = questionnaireResource(signal(this.id));
  protected readonly control = CONTROL;
  protected readonly types = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[];
  protected readonly typeLabels = QUESTION_TYPE_LABELS;
  protected readonly hasOptions = hasOptions;

  /** Começam com o questionário salvo (ou vazios) e não voltam a ele enquanto a pessoa edita. */
  protected readonly title = linkedSignal(() =>
    this.loaded.hasValue() ? this.loaded.value().title : '',
  );
  protected readonly questions = linkedSignal<QuestionDraft[]>(() =>
    this.loaded.hasValue() ? this.loaded.value().questions.map(toQuestionDraft) : [],
  );
  protected readonly saving = signal(false);
  protected readonly loadingTemplate = signal(false);
  protected readonly error = signal<string | null>(null);

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  protected patch(index: number, change: Partial<QuestionDraft>): void {
    this.questions.update((list) =>
      list.map((item, i) => (i === index ? { ...item, ...change } : item)),
    );
  }

  protected add(): void {
    this.questions.update((list) => [
      ...list,
      { text: '', type: 'Text', required: false, optionsText: '' },
    ]);
  }

  protected remove(index: number): void {
    this.questions.update((list) => list.filter((_, i) => i !== index));
  }

  protected move(index: number, delta: number): void {
    this.questions.update((list) => {
      const next = [...list];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  }

  protected async useTemplate(): Promise<void> {
    this.loadingTemplate.set(true);
    this.error.set(null);
    try {
      const template = await firstValueFrom(this.api.template());
      if (!this.title().trim()) this.title.set(template.title);
      this.questions.set(template.questions.map(toQuestionDraft));
    } catch (error) {
      this.error.set(errorSummary(error));
    } finally {
      this.loadingTemplate.set(false);
    }
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    this.saving.set(true);
    this.error.set(null);
    const body = toQuestionnaireRequest(this.title(), this.questions());
    try {
      if (this.id) await firstValueFrom(this.api.update(this.id, body));
      else await firstValueFrom(this.api.create(body));
      this.toaster.show('Questionário salvo.');
      await this.router.navigateByUrl('/nutricionista/questionarios');
    } catch (error) {
      this.error.set(errorSummary(error));
    } finally {
      this.saving.set(false);
    }
  }
}

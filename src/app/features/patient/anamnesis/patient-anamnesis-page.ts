import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideSend } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../../core/http/api-error';
import { AnamnesisAnswers } from '../../../shared/anamnesis/anamnesis-answers';
import {
  ANSWER_TEXT_MAX,
  AnswerDraft,
  EMPTY_ANSWER,
  toAnswers,
} from '../../../shared/anamnesis/anamnesis.models';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { PatientAnamnesisApi, myAnamnesisResource } from './patient-anamnesis-api';

/** Responder uma anamnese pendente (uma vez só) ou rever as respostas enviadas. */
@Component({
  selector: 'app-patient-anamnesis-page',
  imports: [Alert, AnamnesisAnswers, Button, LoadError, LucideArrowLeft, LucideSend, RouterLink],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <a
      routerLink="/paciente/anamneses"
      class="inline-flex items-center gap-2 self-start text-label-lg text-link hover:underline"
    >
      <svg lucideArrowLeft class="size-4"></svg>
      Voltar para as anamneses
    </a>

    @if (anamnesis.error()) {
      <app-load-error [error]="anamnesis.error()" (retry)="anamnesis.reload()" />
    } @else if (!anamnesis.hasValue()) {
      <div
        class="h-64 rounded-container bg-surface-muted motion-safe:animate-pulse"
        aria-hidden="true"
      ></div>
      <span class="sr-only" role="status">Carregando anamnese…</span>
    } @else if (anamnesis.value().status === 'Submitted') {
      <app-anamnesis-answers [anamnesis]="anamnesis.value()" />
    } @else {
      @let current = anamnesis.value();
      <form
        class="flex flex-col gap-5 rounded-container bg-surface p-5 shadow-1 sm:p-6"
        (submit)="submit($event)"
      >
        <header class="flex flex-col gap-1">
          <h1 class="text-headline-lg text-ink">{{ current.title }}</h1>
          <p class="text-body-md text-ink-muted">
            De {{ current.nutritionistName }}. Depois de enviar, as respostas não podem ser
            alteradas. As marcadas como obrigatórias precisam de resposta.
          </p>
        </header>

        <ol class="flex flex-col gap-5">
          @for (question of current.questions; track question.id; let index = $index) {
            @let draft = drafts()[question.id] ?? empty;
            <li>
              @switch (question.type) {
                @case ('Text') {
                  <div class="flex flex-col gap-1.5">
                    <label [for]="'resposta-' + question.id" class="text-label-lg text-ink">
                      {{ index + 1 }}. {{ question.text }}
                      @if (question.required) {
                        <span class="text-body-sm text-ink-muted">(obrigatória)</span>
                      }
                    </label>
                    <textarea
                      [id]="'resposta-' + question.id"
                      class="min-h-24 w-full rounded-control border border-line bg-surface px-3 py-2 text-body-lg text-ink focus:border-focus focus:ring-4 focus:ring-primary/20 focus:outline-none"
                      [attr.maxlength]="textMax"
                      [required]="question.required"
                      [value]="draft.text"
                      (input)="set(question.id, { text: $any($event.target).value })"
                    ></textarea>
                  </div>
                }
                @default {
                  <fieldset class="flex flex-col gap-2">
                    <legend class="mb-1 text-label-lg text-ink">
                      {{ index + 1 }}. {{ question.text }}
                      @if (question.required) {
                        <span class="text-body-sm text-ink-muted">(obrigatória)</span>
                      }
                    </legend>
                    @if (question.type === 'YesNo') {
                      @for (option of yesNo; track option.label) {
                        <label
                          class="flex min-h-11 cursor-pointer items-center gap-3 text-body-lg text-ink"
                        >
                          <input
                            type="radio"
                            class="size-5 cursor-pointer accent-primary"
                            [name]="question.id"
                            [required]="question.required"
                            [checked]="draft.yesNo === option.value"
                            (change)="set(question.id, { yesNo: option.value })"
                          />
                          {{ option.label }}
                        </label>
                      }
                    } @else {
                      @for (option of question.options; track option) {
                        <label
                          class="flex min-h-11 cursor-pointer items-center gap-3 text-body-lg text-ink"
                        >
                          <input
                            class="size-5 cursor-pointer accent-primary"
                            [type]="question.type === 'SingleChoice' ? 'radio' : 'checkbox'"
                            [name]="question.id"
                            [required]="question.required && question.type === 'SingleChoice'"
                            [checked]="draft.options.includes(option)"
                            (change)="
                              toggle(
                                question.id,
                                question.type === 'SingleChoice',
                                option,
                                $any($event.target).checked
                              )
                            "
                          />
                          {{ option }}
                        </label>
                      }
                    }
                  </fieldset>
                }
              }
            </li>
          }
        </ol>

        @if (error(); as message) {
          <app-alert tone="danger">{{ message }}</app-alert>
        }

        <div class="border-t border-divider pt-5">
          <button appButton type="submit" [loading]="sending()">
            <svg lucideSend class="size-5"></svg>
            Enviar respostas
          </button>
        </div>
      </form>
    }
  `,
})
export class PatientAnamnesisPage {
  private readonly api = inject(PatientAnamnesisApi);
  private readonly toaster = inject(Toaster);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('anamnesisId') ?? '';

  protected readonly anamnesis = myAnamnesisResource(signal(this.id));
  protected readonly drafts = signal<Record<string, AnswerDraft>>({});
  protected readonly empty = EMPTY_ANSWER;
  protected readonly textMax = ANSWER_TEXT_MAX;
  protected readonly yesNo = [
    { label: 'Sim', value: true },
    { label: 'Não', value: false },
  ];
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);

  protected set(questionId: string, change: Partial<AnswerDraft>): void {
    this.drafts.update((all) => ({
      ...all,
      [questionId]: { ...(all[questionId] ?? EMPTY_ANSWER), ...change },
    }));
  }

  protected toggle(questionId: string, single: boolean, option: string, checked: boolean): void {
    const current = this.drafts()[questionId]?.options ?? [];
    const options = single
      ? [option]
      : checked
        ? [...current, option]
        : current.filter((item) => item !== option);
    this.set(questionId, { options });
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.anamnesis.hasValue()) return;
    this.sending.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(
        this.api.answer(this.id, toAnswers(this.anamnesis.value().questions, this.drafts())),
      );
      this.toaster.show('Respostas enviadas ao seu nutricionista.');
      this.anamnesis.reload();
    } catch (error) {
      this.error.set(toApiError(error).message);
    } finally {
      this.sending.set(false);
    }
  }
}

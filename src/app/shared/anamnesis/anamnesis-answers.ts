import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ANAMNESIS_STATUS_LABELS, Anamnesis, answerText } from './anamnesis.models';

/** Uma anamnese só para leitura: cada pergunta com a resposta (ou "Sem resposta"). */
@Component({
  selector: 'app-anamnesis-answers',
  imports: [DatePipe],
  host: { class: 'flex flex-col gap-5 rounded-container bg-surface p-5 shadow-1 sm:p-6' },
  template: `
    <header class="flex flex-col gap-1">
      <p class="flex flex-wrap items-center gap-2 text-body-sm text-ink-muted">
        <span
          class="rounded-pill px-2.5 py-0.5 text-label-md"
          [class]="
            anamnesis().status === 'Submitted'
              ? 'bg-success-soft text-success-ink'
              : 'bg-warning-soft text-warning-ink'
          "
          >{{ statusLabels[anamnesis().status] }}</span
        >
        Enviada em {{ anamnesis().sentAt | date: 'dd/MM/yyyy' }}
        @if (anamnesis().submittedAt; as submittedAt) {
          · respondida em {{ submittedAt | date: 'dd/MM/yyyy' }}
        }
      </p>
      <h1 class="text-headline-lg text-ink">{{ anamnesis().title }}</h1>
    </header>

    @if (anamnesis().status === 'Pending') {
      <p class="text-body-md text-ink-muted">O paciente ainda não respondeu.</p>
    }

    <dl class="flex flex-col divide-y divide-divider border-y border-divider">
      @for (row of rows(); track row.id; let index = $index) {
        <div class="flex flex-col gap-1 py-3">
          <dt class="text-label-lg text-ink">{{ index + 1 }}. {{ row.text }}</dt>
          <dd
            class="text-body-md whitespace-pre-line"
            [class]="row.answer ? 'text-ink' : 'text-ink-muted italic'"
          >
            {{ row.answer ?? 'Sem resposta' }}
          </dd>
        </div>
      }
    </dl>
  `,
})
export class AnamnesisAnswers {
  readonly anamnesis = input.required<Anamnesis>();

  protected readonly statusLabels = ANAMNESIS_STATUS_LABELS;
  protected readonly rows = computed(() => {
    const { questions, answers } = this.anamnesis();
    return questions.map((question) => ({
      id: question.id,
      text: question.text,
      answer: answerText(
        question,
        answers?.find((answer) => answer.questionId === question.id),
      ),
    }));
  });
}

import { Component, booleanAttribute, input, output, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  form,
  maxLength,
  min,
  required,
  validate,
} from '@angular/forms/signals';
import { LucideScale } from '@lucide/angular';
import { RecordWeightRequest, WEIGHT_MAX_DAYS_BACK } from '../domain/weight';
import { Alert } from '../ui/alert/alert';
import { Button } from '../ui/button/button';
import { Field } from '../ui/field/field';
import { FieldInput } from '../ui/field/field-input';
import { Modal } from '../ui/modal/modal';
import { daysAgoIsoDate, localIsoDate } from '../util/dates';

interface WeightForm {
  weightKg: number | null;
  recordedOn: string;
  notes: string;
}

const NOTES_MAX = 500;

/**
 * Modal de registro de peso (paciente e nutricionista). Valida o que a API documenta
 * (data de hoje até 365 dias atrás); a faixa de peso fica com a API, que devolve a mensagem.
 */
@Component({
  selector: 'app-weight-form-modal',
  imports: [Alert, Button, Field, FieldInput, FormField, FormRoot, LucideScale, Modal],
  template: `
    <app-modal
      heading="Registrar peso"
      [subtitle]="subtitle()"
      size="sm"
      [busy]="busy()"
      (closed)="closed.emit()"
    >
      <form [formRoot]="weightForm" id="form-peso" class="flex flex-col gap-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <app-field label="Peso">
            <input
              appInput
              cdkFocusInitial
              [formField]="weightForm.weightKg"
              type="number"
              inputmode="decimal"
              step="0.1"
              placeholder="72,5"
              class="pr-10"
            />
            <span class="pointer-events-none absolute right-3 text-label-md text-ink-muted"
              >kg</span
            >
          </app-field>
          <app-field label="Data">
            <input
              appInput
              [formField]="weightForm.recordedOn"
              type="date"
              [min]="minDate"
              [max]="maxDate"
            />
          </app-field>
        </div>
        <app-field label="Observação (opcional)" [hint]="notesHint()">
          <textarea
            appInput
            [formField]="weightForm.notes"
            rows="3"
            placeholder="Ex.: pesagem em jejum, após a consulta"
          ></textarea>
        </app-field>
        <p class="text-body-sm text-ink-muted">{{ sameDayHint() }}</p>
        @if (error(); as message) {
          <app-alert tone="danger">{{ message }}</app-alert>
        }
      </form>
      <ng-container modalActions>
        <button appButton variant="soft" type="button" [disabled]="busy()" (click)="closed.emit()">
          Cancelar
        </button>
        <button appButton type="submit" form="form-peso" [loading]="busy()">
          <svg lucideScale class="size-5"></svg>
          Salvar peso
        </button>
      </ng-container>
    </app-modal>
  `,
})
export class WeightFormModal {
  readonly subtitle = input('Um registro por dia. A data pode ser de hoje até um ano atrás.');
  /** Texto sobre o que acontece se já houver registro na data (muda entre paciente e nutricionista). */
  readonly sameDayHint = input('Se você já registrou nesta data, o registro será atualizado.');
  readonly busy = input(false, { transform: booleanAttribute });
  readonly error = input<string | null>(null);
  readonly saved = output<RecordWeightRequest>();
  readonly closed = output();

  protected readonly maxDate = localIsoDate();
  protected readonly minDate = daysAgoIsoDate(WEIGHT_MAX_DAYS_BACK);

  protected readonly model = signal<WeightForm>({
    weightKg: null,
    recordedOn: this.maxDate,
    notes: '',
  });
  protected readonly weightForm = form(
    this.model,
    (path) => {
      required(path.weightKg, { message: 'Informe o peso.' });
      min(path.weightKg, 0.1, { message: 'O peso deve ser maior que zero.' });
      required(path.recordedOn, { message: 'Informe a data.' });
      validate(path.recordedOn, ({ value }) => {
        const date = value();
        if (!date) {
          return undefined;
        }
        if (date > this.maxDate) {
          return { kind: 'future', message: 'A data não pode ser futura.' };
        }
        return date < this.minDate
          ? { kind: 'too-old', message: 'A data pode ser de até um ano atrás.' }
          : undefined;
      });
      maxLength(path.notes, NOTES_MAX, {
        message: `A observação pode ter até ${NOTES_MAX} caracteres.`,
      });
    },
    { name: 'weight', submission: { action: async () => this.submit() } },
  );

  protected notesHint(): string {
    return `${this.model().notes.length}/${NOTES_MAX} caracteres`;
  }

  private submit(): undefined {
    const { weightKg, recordedOn, notes } = this.model();
    this.saved.emit({ weightKg: weightKg ?? 0, recordedOn, notes: notes.trim() || null });
    return undefined;
  }
}

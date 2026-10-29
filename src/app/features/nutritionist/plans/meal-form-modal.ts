import { Component, booleanAttribute, input, linkedSignal, output } from '@angular/core';
import { FormField, FormRoot, form, maxLength, required, validate } from '@angular/forms/signals';
import { LucideUtensils } from '@lucide/angular';
import { Meal, MealRequest } from '../../../shared/domain/nutrition-plan';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { FieldInput } from '../../../shared/ui/field/field-input';
import { Modal } from '../../../shared/ui/modal/modal';

interface MealForm {
  name: string;
  suggestedTime: string;
  notes: string;
}

const NAME_MAX = 60;
const NOTES_MAX = 500;
const SUGGESTIONS = [
  'Café da manhã',
  'Lanche da manhã',
  'Almoço',
  'Lanche da tarde',
  'Jantar',
  'Ceia',
];

/** Criar (sem `meal`) ou editar uma refeição. O horário é opcional e não muda a ordem. */
@Component({
  selector: 'app-meal-form-modal',
  imports: [Alert, Button, Field, FieldInput, FormField, FormRoot, LucideUtensils, Modal],
  template: `
    <app-modal
      [heading]="meal() ? 'Editar refeição' : 'Nova refeição'"
      [subtitle]="meal() ? undefined : 'Entra no fim da lista. Depois dá para mudar a ordem.'"
      size="sm"
      [busy]="busy()"
      (closed)="closed.emit()"
    >
      <form [formRoot]="mealForm" id="form-refeicao" class="flex flex-col gap-4">
        <app-field label="Nome da refeição">
          <input
            appInput
            cdkFocusInitial
            [formField]="mealForm.name"
            placeholder="Ex.: Café da manhã"
            list="sugestoes-refeicao"
          />
          <datalist id="sugestoes-refeicao">
            @for (suggestion of suggestions; track suggestion) {
              <option [value]="suggestion"></option>
            }
          </datalist>
        </app-field>
        <app-field
          label="Horário sugerido (opcional)"
          hint="Avisamos se cair enquanto o paciente dorme."
        >
          <input appInput [formField]="mealForm.suggestedTime" type="time" />
        </app-field>
        <app-field label="Observações (opcional)" [hint]="notesHint()">
          <textarea
            appInput
            [formField]="mealForm.notes"
            rows="3"
            placeholder="Ex.: Em jejum, beber água antes."
          ></textarea>
        </app-field>
        @if (error(); as message) {
          <app-alert tone="danger">{{ message }}</app-alert>
        }
      </form>
      <ng-container modalActions>
        <button appButton variant="soft" type="button" [disabled]="busy()" (click)="closed.emit()">
          Cancelar
        </button>
        <button appButton type="submit" form="form-refeicao" [loading]="busy()">
          <svg lucideUtensils class="size-5"></svg>
          {{ meal() ? 'Salvar refeição' : 'Adicionar refeição' }}
        </button>
      </ng-container>
    </app-modal>
  `,
})
export class MealFormModal {
  readonly meal = input<Meal | null>(null);
  readonly busy = input(false, { transform: booleanAttribute });
  readonly error = input<string | null>(null);
  readonly saved = output<MealRequest>();
  readonly closed = output();

  protected readonly suggestions = SUGGESTIONS;
  protected readonly model = linkedSignal<MealForm>(() => {
    const meal = this.meal();
    return {
      name: meal?.name ?? '',
      // A API devolve "07:00:00"; o campo e o envio usam "07:00".
      suggestedTime: meal?.suggestedTime?.slice(0, 5) ?? '',
      notes: meal?.notes ?? '',
    };
  });
  protected readonly mealForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'Informe o nome da refeição.' });
      validate(path.name, ({ value }) =>
        value() && !value().trim()
          ? { kind: 'blank', message: 'Informe o nome da refeição.' }
          : undefined,
      );
      maxLength(path.name, NAME_MAX, { message: `O nome pode ter até ${NAME_MAX} caracteres.` });
      maxLength(path.notes, NOTES_MAX, {
        message: `As observações podem ter até ${NOTES_MAX} caracteres.`,
      });
    },
    { name: 'meal', submission: { action: async () => this.submit() } },
  );

  protected notesHint(): string {
    return `${this.model().notes.length}/${NOTES_MAX} caracteres`;
  }

  private submit(): undefined {
    const { name, suggestedTime, notes } = this.model();
    this.saved.emit({
      name: name.trim(),
      suggestedTime: suggestedTime || null,
      notes: notes.trim() || null,
    });
    return undefined;
  }
}

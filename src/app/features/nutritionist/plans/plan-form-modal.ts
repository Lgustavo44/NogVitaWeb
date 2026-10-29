import { Component, booleanAttribute, input, linkedSignal, output } from '@angular/core';
import { FormField, FormRoot, form, maxLength, required, validate } from '@angular/forms/signals';
import { LucideClipboardList } from '@lucide/angular';
import { NutritionPlan, PlanRequest } from '../../../shared/domain/nutrition-plan';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { FieldInput } from '../../../shared/ui/field/field-input';
import { Modal } from '../../../shared/ui/modal/modal';
import { localIsoDate } from '../../../shared/util/dates';

interface PlanForm {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

const NAME_MAX = 100;
const DESCRIPTION_MAX = 1000;

/** Criar (sem `plan`) ou editar os dados do plano: nome, descrição e período. */
@Component({
  selector: 'app-plan-form-modal',
  imports: [Alert, Button, Field, FieldInput, FormField, FormRoot, LucideClipboardList, Modal],
  template: `
    <app-modal
      [heading]="plan() ? 'Editar dados do plano' : 'Novo plano alimentar'"
      [subtitle]="
        plan()
          ? 'As refeições não mudam.'
          : 'O plano começa como rascunho: o paciente só vê depois de ativado.'
      "
      [busy]="busy()"
      (closed)="closed.emit()"
    >
      <form [formRoot]="planForm" id="form-plano" class="flex flex-col gap-4">
        <app-field label="Nome do plano">
          <input
            appInput
            cdkFocusInitial
            [formField]="planForm.name"
            placeholder="Ex.: Plano de hipertrofia"
          />
        </app-field>
        <app-field label="Descrição (opcional)" [hint]="descriptionHint()">
          <textarea
            appInput
            [formField]="planForm.description"
            rows="3"
            placeholder="Ex.: Foco em proteína distribuída ao longo do dia."
          ></textarea>
        </app-field>
        <div class="grid gap-4 sm:grid-cols-2">
          <app-field label="Início">
            <input appInput [formField]="planForm.startDate" type="date" />
          </app-field>
          <app-field label="Término (opcional)" hint="Em branco: sem data prevista.">
            <input appInput [formField]="planForm.endDate" type="date" [min]="model().startDate" />
          </app-field>
        </div>
        @if (error(); as message) {
          <app-alert tone="danger">{{ message }}</app-alert>
        }
      </form>
      <ng-container modalActions>
        <button appButton variant="soft" type="button" [disabled]="busy()" (click)="closed.emit()">
          Cancelar
        </button>
        <button appButton type="submit" form="form-plano" [loading]="busy()">
          <svg lucideClipboardList class="size-5"></svg>
          {{ plan() ? 'Salvar dados' : 'Criar rascunho' }}
        </button>
      </ng-container>
    </app-modal>
  `,
})
export class PlanFormModal {
  /** Plano a editar; sem ele, o formulário cria um novo. */
  readonly plan = input<NutritionPlan | null>(null);
  readonly busy = input(false, { transform: booleanAttribute });
  readonly error = input<string | null>(null);
  readonly saved = output<PlanRequest>();
  readonly closed = output();

  /** Começa com os dados do plano (edição) ou vazio, com início hoje (criação). */
  protected readonly model = linkedSignal<PlanForm>(() => {
    const plan = this.plan();
    return {
      name: plan?.name ?? '',
      description: plan?.description ?? '',
      startDate: plan?.startDate ?? localIsoDate(),
      endDate: plan?.endDate ?? '',
    };
  });
  protected readonly planForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'Informe o nome do plano.' });
      validate(path.name, ({ value }) =>
        value().trim() || !value()
          ? undefined
          : { kind: 'blank', message: 'Informe o nome do plano.' },
      );
      maxLength(path.name, NAME_MAX, { message: `O nome pode ter até ${NAME_MAX} caracteres.` });
      maxLength(path.description, DESCRIPTION_MAX, {
        message: `A descrição pode ter até ${DESCRIPTION_MAX} caracteres.`,
      });
      required(path.startDate, { message: 'Informe a data de início.' });
      validate(path.endDate, ({ value, valueOf }) => {
        const end = value();
        const start = valueOf(path.startDate);
        return end && start && end < start
          ? { kind: 'before-start', message: 'O término não pode ser antes do início.' }
          : undefined;
      });
    },
    { name: 'plan', submission: { action: async () => this.submit() } },
  );

  protected descriptionHint(): string {
    return `${this.model().description.length}/${DESCRIPTION_MAX} caracteres`;
  }

  private submit(): undefined {
    const { name, description, startDate, endDate } = this.model();
    this.saved.emit({
      name: name.trim(),
      description: description.trim() || null,
      startDate,
      endDate: endDate || null,
    });
    return undefined;
  }
}

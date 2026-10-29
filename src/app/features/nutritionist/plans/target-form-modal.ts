import { Component, booleanAttribute, input, linkedSignal, output } from '@angular/core';
import { FormField, FormRoot, form, min, required } from '@angular/forms/signals';
import { LucideTarget } from '@lucide/angular';
import { NutritionPlan, PlanTargetRequest } from '../../../shared/domain/nutrition-plan';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { FieldInput } from '../../../shared/ui/field/field-input';
import { Modal } from '../../../shared/ui/modal/modal';

interface TargetForm {
  energyKcal: number | null;
  proteinGrams: number | null;
  carbohydrateGrams: number | null;
  fatGrams: number | null;
}

/** Meta diária: calorias obrigatórias; proteína, carboidrato e gordura opcionais. */
@Component({
  selector: 'app-target-form-modal',
  imports: [Alert, Button, Field, FieldInput, FormField, FormRoot, LucideTarget, Modal],
  template: `
    <app-modal
      heading="Meta diária"
      subtitle="O resumo do dia passa a comparar o planejado com a meta."
      size="sm"
      [busy]="busy()"
      (closed)="closed.emit()"
    >
      <form [formRoot]="targetForm" id="form-meta" class="flex flex-col gap-4">
        <app-field label="Calorias">
          <input
            appInput
            cdkFocusInitial
            [formField]="targetForm.energyKcal"
            type="number"
            inputmode="decimal"
            placeholder="2000"
            class="pr-14"
          />
          <span class="pointer-events-none absolute right-3 text-label-md text-ink-muted"
            >kcal</span
          >
        </app-field>
        <p class="text-body-sm text-ink-muted">
          Macronutrientes (opcionais): em branco, ficam fora da comparação.
        </p>
        <div class="grid gap-4 sm:grid-cols-3">
          <app-field label="Proteínas">
            <input
              appInput
              [formField]="targetForm.proteinGrams"
              type="number"
              inputmode="decimal"
              class="pr-8"
            />
            <span class="pointer-events-none absolute right-3 text-label-md text-ink-muted">g</span>
          </app-field>
          <app-field label="Carboidratos">
            <input
              appInput
              [formField]="targetForm.carbohydrateGrams"
              type="number"
              inputmode="decimal"
              class="pr-8"
            />
            <span class="pointer-events-none absolute right-3 text-label-md text-ink-muted">g</span>
          </app-field>
          <app-field label="Gorduras">
            <input
              appInput
              [formField]="targetForm.fatGrams"
              type="number"
              inputmode="decimal"
              class="pr-8"
            />
            <span class="pointer-events-none absolute right-3 text-label-md text-ink-muted">g</span>
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
        <button appButton type="submit" form="form-meta" [loading]="busy()">
          <svg lucideTarget class="size-5"></svg>
          Salvar meta
        </button>
      </ng-container>
    </app-modal>
  `,
})
export class TargetFormModal {
  /** Para começar com a meta atual. */
  readonly plan = input.required<NutritionPlan>();
  readonly busy = input(false, { transform: booleanAttribute });
  readonly error = input<string | null>(null);
  readonly saved = output<PlanTargetRequest>();
  readonly closed = output();

  protected readonly model = linkedSignal<TargetForm>(() => {
    const plan = this.plan();
    return {
      energyKcal: plan.targetEnergyKcal,
      proteinGrams: plan.targetProteinGrams,
      carbohydrateGrams: plan.targetCarbohydrateGrams,
      fatGrams: plan.targetFatGrams,
    };
  });
  protected readonly targetForm = form(
    this.model,
    (path) => {
      required(path.energyKcal, { message: 'Informe as calorias.' });
      min(path.energyKcal, 1, { message: 'As calorias devem ser maiores que zero.' });
      min(path.proteinGrams, 0, { message: 'Não pode ser negativo.' });
      min(path.carbohydrateGrams, 0, { message: 'Não pode ser negativo.' });
      min(path.fatGrams, 0, { message: 'Não pode ser negativo.' });
    },
    { name: 'target', submission: { action: async () => this.submit() } },
  );

  private submit(): undefined {
    const { energyKcal, proteinGrams, carbohydrateGrams, fatGrams } = this.model();
    this.saved.emit({
      energyKcal: energyKcal ?? 0,
      proteinGrams: proteinGrams ?? null,
      carbohydrateGrams: carbohydrateGrams ?? null,
      fatGrams: fatGrams ?? null,
    });
    return undefined;
  }
}

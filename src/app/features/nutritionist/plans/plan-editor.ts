import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideBan,
  LucideCircleCheck,
  LucideFileDown,
  LucideFlag,
  LucidePencil,
  LucidePlus,
  LucideTarget,
  LucideUtensils,
} from '@lucide/angular';
import { Observable, firstValueFrom } from 'rxjs';
import { errorSummary, toApiError } from '../../../core/http/api-error';
import {
  MAX_MEALS,
  Meal,
  MealFood,
  MealRequest,
  PlanRequest,
  PlanTargetRequest,
  isEditable,
} from '../../../shared/domain/nutrition-plan';
import { FoodAttribution } from '../../../shared/food/food-attribution';
import { MealCard } from '../../../shared/plan/meal-card';
import { PlanDaySummary } from '../../../shared/plan/plan-day-summary';
import { PlanStatusBadge } from '../../../shared/plan/plan-status-badge';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { parseIsoDate } from '../../../shared/util/dates';
import { FoodPickerModal, FoodPortion } from './food-picker-modal';
import { MealFormModal } from './meal-form-modal';
import { PlanFormModal } from './plan-form-modal';
import { PlansApi, planDetailResource } from './plans-api';
import { TargetFormModal } from './target-form-modal';

interface Confirmation {
  heading: string;
  body: string;
  confirmLabel: string;
  tone: 'primary' | 'danger';
  request: () => Observable<unknown>;
  success: string;
}

/** Um diálogo por vez: o `busy` e o `error` da tela são sempre do diálogo aberto. */
type Dialog =
  | { kind: 'plan' }
  | { kind: 'target' }
  | { kind: 'meal'; meal: Meal | null }
  | { kind: 'food'; meal: Meal; food: MealFood | null }
  | { kind: 'confirm'; confirmation: Confirmation };

@Component({
  selector: 'app-plan-editor',
  imports: [
    Alert,
    Button,
    ConfirmDialog,
    DatePipe,
    FoodAttribution,
    FoodPickerModal,
    LoadError,
    LucideArrowLeft,
    LucideBan,
    LucideCircleCheck,
    LucideFileDown,
    LucideFlag,
    LucidePencil,
    LucidePlus,
    LucideTarget,
    LucideUtensils,
    MealCard,
    MealFormModal,
    PlanDaySummary,
    PlanFormModal,
    PlanStatusBadge,
    RouterLink,
    TargetFormModal,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './plan-editor.html',
})
export class PlanEditorPage {
  private readonly api = inject(PlansApi);
  private readonly toaster = inject(Toaster);
  private readonly planId = inject(ActivatedRoute).snapshot.paramMap.get('planId') ?? '';

  protected readonly detail = planDetailResource(signal(this.planId));
  protected readonly maxMeals = MAX_MEALS;
  protected readonly plan = computed(() =>
    this.detail.hasValue() ? this.detail.value().plan : null,
  );
  protected readonly meals = computed(() =>
    this.detail.hasValue() ? this.detail.value().meals : [],
  );
  protected readonly editable = computed(() => {
    const plan = this.plan();
    return !!plan && isEditable(plan.status);
  });
  protected readonly hasTarget = computed(() => this.plan()?.targetEnergyKcal != null);
  protected readonly attributions = computed(() =>
    this.meals().flatMap((meal) => meal.foods.map((food) => food.attribution)),
  );

  protected readonly dialog = signal<Dialog | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly reordering = signal(false);
  protected readonly downloading = signal(false);

  protected open(dialog: Dialog): void {
    this.error.set(null);
    this.dialog.set(dialog);
  }

  protected close(): void {
    if (!this.busy()) {
      this.dialog.set(null);
    }
  }

  protected date(iso: string): Date {
    return parseIsoDate(iso);
  }

  /* Plano */

  protected savePlan(body: PlanRequest): void {
    void this.run(this.api.update(this.planId, body), 'Dados do plano salvos.');
  }

  protected askActivate(): void {
    this.confirm({
      heading: 'Ativar plano?',
      body: 'O paciente passa a ver este plano. Se ele já tiver um plano ativo, aquele plano será finalizado.',
      confirmLabel: 'Ativar plano',
      tone: 'primary',
      request: () => this.api.activate(this.planId),
      success: 'Plano ativado. O paciente já pode ver.',
    });
  }

  protected askFinish(): void {
    this.confirm({
      heading: 'Finalizar plano?',
      body: 'O término vira hoje e o plano não pode mais ser alterado. O paciente continua vendo no histórico.',
      confirmLabel: 'Finalizar plano',
      tone: 'danger',
      request: () => this.api.finish(this.planId),
      success: 'Plano finalizado.',
    });
  }

  protected askCancel(): void {
    this.confirm({
      heading: 'Cancelar rascunho?',
      body: 'O rascunho não poderá mais ser editado nem ativado. O paciente nunca o verá.',
      confirmLabel: 'Cancelar rascunho',
      tone: 'danger',
      request: () => this.api.cancel(this.planId),
      success: 'Rascunho cancelado.',
    });
  }

  protected async downloadPdf(): Promise<void> {
    const plan = this.plan();
    if (!plan || this.downloading()) {
      return;
    }
    this.downloading.set(true);
    try {
      const blob = await firstValueFrom(this.api.pdf(this.planId));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName(plan.name)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      this.toaster.show(toApiError(error).message, 'danger');
    } finally {
      this.downloading.set(false);
    }
  }

  /* Meta */

  protected saveTarget(body: PlanTargetRequest): void {
    void this.run(this.api.setTarget(this.planId, body), 'Meta diária salva.');
  }

  protected askRemoveTarget(): void {
    this.confirm({
      heading: 'Remover a meta diária?',
      body: 'O resumo do dia deixa de comparar o planejado com a meta.',
      confirmLabel: 'Remover meta',
      tone: 'danger',
      request: () => this.api.removeTarget(this.planId),
      success: 'Meta removida.',
    });
  }

  /* Refeições */

  protected saveMeal(meal: Meal | null, body: MealRequest): void {
    void this.run(
      meal ? this.api.updateMeal(this.planId, meal.id, body) : this.api.addMeal(this.planId, body),
      meal ? 'Refeição salva.' : 'Refeição adicionada.',
    );
  }

  protected askDeleteMeal(meal: Meal): void {
    this.confirm({
      heading: `Remover "${meal.name}"?`,
      body:
        meal.foods.length > 0
          ? `A refeição e os ${meal.foods.length} alimentos dela saem do plano. As outras refeições são renumeradas.`
          : 'A refeição sai do plano. As outras refeições são renumeradas.',
      confirmLabel: 'Remover refeição',
      tone: 'danger',
      request: () => this.api.deleteMeal(this.planId, meal.id),
      success: 'Refeição removida.',
    });
  }

  /** Manda a lista inteira na ordem final, como a API pede. */
  protected async move(index: number, delta: -1 | 1): Promise<void> {
    const ids = this.meals().map((meal) => meal.id);
    const target = index + delta;
    if (this.reordering() || target < 0 || target >= ids.length) {
      return;
    }
    [ids[index], ids[target]] = [ids[target], ids[index]];
    this.reordering.set(true);
    try {
      await firstValueFrom(this.api.reorderMeals(this.planId, ids));
      this.detail.reload();
      this.toaster.show('Ordem das refeições salva.');
    } catch (error) {
      this.toaster.show(errorSummary(error), 'danger');
    } finally {
      this.reordering.set(false);
    }
  }

  /* Alimentos */

  protected saveFood(meal: Meal, food: MealFood | null, portion: FoodPortion): void {
    void this.run(
      food
        ? this.api.updateFood(this.planId, meal.id, food.id, portion.quantityInGrams)
        : this.api.addFood(this.planId, meal.id, portion.foodId, portion.quantityInGrams),
      food ? 'Quantidade alterada.' : 'Alimento adicionado.',
    );
  }

  protected askDeleteFood(meal: Meal, food: MealFood): void {
    this.confirm({
      heading: `Remover "${food.name}"?`,
      body: `Sai de ${meal.name}.`,
      confirmLabel: 'Remover alimento',
      tone: 'danger',
      request: () => this.api.deleteFood(this.planId, meal.id, food.id),
      success: 'Alimento removido.',
    });
  }

  /* Execução */

  protected runConfirmation(confirmation: Confirmation): void {
    void this.run(confirmation.request(), confirmation.success);
  }

  private confirm(confirmation: Confirmation): void {
    this.open({ kind: 'confirm', confirmation });
  }

  /** Envia, fecha o diálogo e recarrega o plano (totais e avisos vêm calculados da API). */
  private async run(request: Observable<unknown>, success: string): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(request);
      this.dialog.set(null);
      this.toaster.show(success);
      this.detail.reload();
    } catch (error) {
      // 404 em qualquer rota: o acompanhamento acabou (ou o plano não é seu).
      if (toApiError(error).status === 404) {
        this.dialog.set(null);
        this.detail.reload();
      }
      this.error.set(errorSummary(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected backLink(): string[] {
    const plan = this.plan();
    return plan ? ['/nutricionista/pacientes', plan.patientId] : ['/nutricionista/planos'];
  }
}

/** "Plano de hipertrofia" → "plano-de-hipertrofia". */
function fileName(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'plano-alimentar'
  );
}

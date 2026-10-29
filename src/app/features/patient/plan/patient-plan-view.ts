import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { LucideFileDown, LucideMail } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../../core/http/api-error';
import { AlertTone } from '../../../shared/ui/alert/alert';
import { NutritionPlanDetail } from '../../../shared/domain/nutrition-plan';
import { FoodAttribution } from '../../../shared/food/food-attribution';
import { MealCard } from '../../../shared/plan/meal-card';
import { PlanDaySummary } from '../../../shared/plan/plan-day-summary';
import { PlanStatusBadge } from '../../../shared/plan/plan-status-badge';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { parseIsoDate } from '../../../shared/util/dates';
import { saveBlob, slugify } from '../../../shared/util/download';
import { PatientApi } from '../patient-api';

/** Mensagens do envio por e-mail que pedem uma ação da pessoa (a da API é genérica). */
const EMAIL_ERRORS: Record<number, { tone: AlertTone; message: string }> = {
  429: {
    tone: 'warning',
    message:
      'Você já enviou o plano 3 vezes na última hora. Tente mais tarde ou baixe o PDF agora.',
  },
  503: {
    tone: 'danger',
    message: 'Não conseguimos enviar o e-mail agora. Baixe o PDF, ou tente de novo em instantes.',
  },
};

/** Plano do paciente, só leitura: dados, PDF (baixar ou receber por e-mail), resumo e refeições. */
@Component({
  selector: 'app-patient-plan-view',
  imports: [
    Alert,
    Button,
    DatePipe,
    FoodAttribution,
    LucideFileDown,
    LucideMail,
    MealCard,
    PlanDaySummary,
    PlanStatusBadge,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './patient-plan-view.html',
})
export class PatientPlanView {
  private readonly api = inject(PatientApi);
  private readonly toaster = inject(Toaster);

  readonly detail = input.required<NutritionPlanDetail>();

  protected readonly plan = computed(() => this.detail().plan);
  protected readonly attributions = computed(() =>
    this.detail().meals.flatMap((meal) => meal.foods.map((food) => food.attribution)),
  );

  protected readonly downloading = signal(false);
  protected readonly sending = signal(false);
  /** Resultado do envio por e-mail que precisa ficar na tela (limite atingido, falha). */
  protected readonly emailProblem = signal<{ tone: AlertTone; message: string } | null>(null);

  protected date(iso: string): Date {
    return parseIsoDate(iso);
  }

  protected async downloadPdf(): Promise<void> {
    if (this.downloading()) {
      return;
    }
    this.downloading.set(true);
    try {
      const blob = await firstValueFrom(this.api.planPdf(this.plan().id));
      saveBlob(blob, `${slugify(this.plan().name, 'plano-alimentar')}.pdf`);
    } catch (error) {
      this.toaster.show(toApiError(error).message, 'danger');
    } finally {
      this.downloading.set(false);
    }
  }

  protected async sendByEmail(): Promise<void> {
    if (this.sending()) {
      return;
    }
    this.sending.set(true);
    this.emailProblem.set(null);
    try {
      await firstValueFrom(this.api.emailPlanPdf(this.plan().id));
      this.toaster.show('Enviamos o PDF para o e-mail da sua conta.');
    } catch (error) {
      const apiError = toApiError(error);
      this.emailProblem.set(
        EMAIL_ERRORS[apiError.status] ?? { tone: 'danger', message: apiError.message },
      );
    } finally {
      this.sending.set(false);
    }
  }
}

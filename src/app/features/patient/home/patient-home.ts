import { DatePipe, DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideChartLine,
  LucideClock,
  LucideFlame,
  LucideScale,
  LucideStethoscope,
  LucideTarget,
  LucideUtensils,
} from '@lucide/angular';
import { apiUrl } from '../../../core/http/api-url';
import { isNotFound } from '../../../core/http/resource-status';
import { Meal } from '../../../shared/domain/nutrition-plan';
import { PagedResponse } from '../../../shared/domain/paged-response';
import { GOAL_LABELS } from '../../../shared/domain/patient-enums';
import { WeightRecord } from '../../../shared/domain/weight';
import { Alert } from '../../../shared/ui/alert/alert';
import { Avatar } from '../../../shared/ui/avatar/avatar';
import { DayPeriodIcon, dayPeriod, greetingText } from '../../../shared/ui/greeting/greeting';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { daysAgoIsoDate, parseIsoDate } from '../../../shared/util/dates';
import { WeightChart } from '../../../shared/weight/weight-chart';
import { myAnamnesesResource } from '../anamnesis/patient-anamnesis-api';
import { careRelationshipResource, currentPlanResource } from '../patient-api';
import { PatientProfileStore } from '../patient-profile-store';

const WEIGHT_DAYS = 90;

/** A próxima refeição com horário a partir de `now` ("HH:mm"); passou a última, a primeira de amanhã. */
export function nextMealAt(meals: Meal[], now: string): { meal: Meal; tomorrow: boolean } | null {
  const timed = meals
    .filter((meal) => meal.suggestedTime)
    .sort((a, b) => a.suggestedTime!.localeCompare(b.suggestedTime!));
  if (timed.length === 0) return null;
  const today = timed.find((meal) => meal.suggestedTime!.slice(0, 5) >= now);
  return today ? { meal: today, tomorrow: false } : { meal: timed[0], tomorrow: true };
}

@Component({
  selector: 'app-patient-home',
  imports: [
    Alert,
    Avatar,
    DatePipe,
    DayPeriodIcon,
    DecimalPipe,
    LoadError,
    PageHeader,
    RouterLink,
    WeightChart,
    LucideChartLine,
    LucideClock,
    LucideFlame,
    LucideScale,
    LucideStethoscope,
    LucideTarget,
    LucideUtensils,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './patient-home.html',
})
export class PatientHome {
  protected readonly profile = inject(PatientProfileStore).profile;
  protected readonly care = careRelationshipResource();
  protected readonly plan = currentPlanResource();
  private readonly anamneses = myAnamnesesResource();
  protected readonly weights = httpResource<PagedResponse<WeightRecord>>(() => ({
    url: apiUrl('/patients/me/weight-records'),
    params: { page: 1, pageSize: 100, from: daysAgoIsoDate(WEIGHT_DAYS) },
  }));

  protected readonly goalLabels = GOAL_LABELS;

  protected readonly firstName = computed(() =>
    this.profile.hasValue() ? this.profile.value().name.split(' ')[0] : null,
  );
  private readonly now = new Date();
  protected readonly period = dayPeriod(this.now);
  protected readonly greeting = computed(() => greetingText(this.period, this.firstName()));
  /** 404 aqui significa "ainda não tem": vira estado vazio, não erro. */
  protected readonly careMissing = computed(() => isNotFound(this.care.error()));
  protected readonly planMissing = computed(() => isNotFound(this.plan.error()));

  /** Falha ao carregar não vira erro aqui: a página de anamneses já mostra. */
  protected readonly pendingAnamneses = computed(() =>
    this.anamneses.hasValue()
      ? this.anamneses.value().items.filter((item) => item.status === 'Pending')
      : [],
  );

  protected readonly weightItems = computed(() =>
    this.weights.hasValue()
      ? [...this.weights.value().items].sort((a, b) => a.recordedOn.localeCompare(b.recordedOn))
      : [],
  );
  protected readonly weightSummary = computed(() => {
    const items = this.weightItems();
    const latest = items.at(-1);
    return latest
      ? { latest, change: latest.weightKg - items[0].weightKg, count: items.length }
      : null;
  });

  /** A meta do nutricionista; sem meta, o que o plano soma. */
  protected readonly dailyKcal = computed(() =>
    this.plan.hasValue()
      ? (this.plan.value().plan.targetEnergyKcal ?? this.plan.value().dailyTotals.energyKcal.value)
      : null,
  );
  protected readonly nextMeal = computed(() =>
    this.plan.hasValue()
      ? nextMealAt(this.plan.value().meals, this.now.toTimeString().slice(0, 5))
      : null,
  );

  /** Data sem hora como Date local (o `| date` também aceita a string "AAAA-MM-DD" direto). */
  protected date(iso: string): Date {
    return parseIsoDate(iso);
  }

  protected time(value: string | null): string {
    return value ? value.slice(0, 5) : 'Não informado';
  }
}

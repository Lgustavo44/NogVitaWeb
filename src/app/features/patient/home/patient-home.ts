import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { LucideClock, LucideStethoscope, LucideTarget, LucideUtensils } from '@lucide/angular';
import { isNotFound } from '../../../core/http/resource-status';
import { BIOLOGICAL_SEX_LABELS, GOAL_LABELS } from '../../../shared/domain/patient-enums';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { careRelationshipResource, currentPlanResource } from '../patient-api';
import { PatientProfileStore } from '../patient-profile-store';

@Component({
  selector: 'app-patient-home',
  imports: [DatePipe, LoadError, LucideClock, LucideStethoscope, LucideTarget, LucideUtensils],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './patient-home.html',
})
export class PatientHome {
  protected readonly profile = inject(PatientProfileStore).profile;
  protected readonly care = careRelationshipResource();
  protected readonly plan = currentPlanResource();

  protected readonly goalLabels = GOAL_LABELS;
  protected readonly sexLabels = BIOLOGICAL_SEX_LABELS;
  protected readonly today = new Date();

  protected readonly firstName = computed(() =>
    this.profile.hasValue() ? this.profile.value().name.split(' ')[0] : null,
  );
  /** 404 aqui significa "ainda não tem": vira estado vazio, não erro. */
  protected readonly careMissing = computed(() => isNotFound(this.care.error()));
  protected readonly planMissing = computed(() => isNotFound(this.plan.error()));

  protected time(value: string | null): string {
    return value ? value.slice(0, 5) : 'Não informado';
  }
}

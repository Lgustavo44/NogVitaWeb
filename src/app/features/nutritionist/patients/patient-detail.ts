import { DecimalPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideClock3, LucideTriangleAlert, LucideUserX } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../../core/http/api-error';
import { BIOLOGICAL_SEX_LABELS, GOAL_LABELS } from '../../../shared/domain/patient-enums';
import { Button } from '../../../shared/ui/button/button';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { Modal } from '../../../shared/ui/modal/modal';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { WeightPanel } from '../../../shared/weight/weight-panel';
import { NutritionistApi, followedPatientResource } from '../nutritionist-api';
import { PatientPlans } from '../plans/patient-plans';

@Component({
  selector: 'app-patient-detail',
  imports: [
    Button,
    DatePipe,
    DecimalPipe,
    LoadError,
    LucideArrowLeft,
    LucideClock3,
    LucideTriangleAlert,
    LucideUserX,
    Modal,
    PageHeader,
    PatientPlans,
    RouterLink,
    WeightPanel,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './patient-detail.html',
})
export class PatientDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(NutritionistApi);
  private readonly toaster = inject(Toaster);
  protected readonly patientId = this.route.snapshot.paramMap.get('patientId');

  protected readonly patient = followedPatientResource(signal(this.patientId));
  protected readonly sexLabels = BIOLOGICAL_SEX_LABELS;
  protected readonly goalLabels = GOAL_LABELS;
  protected readonly confirming = signal(false);
  protected readonly ending = signal(false);
  protected readonly endError = signal<string | null>(null);

  protected openConfirm(): void {
    this.endError.set(null);
    this.confirming.set(true);
  }

  protected closeConfirm(): void {
    if (!this.ending()) this.confirming.set(false);
  }

  protected async endCare(): Promise<void> {
    if (!this.patientId || this.ending()) return;
    this.ending.set(true);
    this.endError.set(null);
    try {
      await firstValueFrom(this.api.endPatientCare(this.patientId));
      this.confirming.set(false);
      this.toaster.show('Acompanhamento encerrado.');
      await this.router.navigateByUrl('/nutricionista/pacientes');
    } catch (error) {
      this.endError.set(toApiError(error).message);
    } finally {
      this.ending.set(false);
    }
  }

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts.at(-1)?.[0] ?? '')).toUpperCase();
  }

  protected time(value: string | null): string {
    return value ? value.slice(0, 5) : 'Não informado';
  }
}

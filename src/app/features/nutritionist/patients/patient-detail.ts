import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideCalendarDays,
  LucideClock3,
  LucidePlus,
  LucideTriangleAlert,
  LucideUserX,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../../core/http/api-error';
import { BIOLOGICAL_SEX_LABELS, GOAL_LABELS } from '../../../shared/domain/patient-enums';
import { Button } from '../../../shared/ui/button/button';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { Modal } from '../../../shared/ui/modal/modal';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Toaster } from '../../../shared/ui/toast/toaster';
import {
  followedPatientResource,
  NutritionistApi,
  patientWeightRecordsResource,
} from '../nutritionist-api';
import { RecordWeightRequest } from '../nutritionist.models';

@Component({
  selector: 'app-patient-detail',
  imports: [
    Button,
    DatePipe,
    DecimalPipe,
    LoadError,
    LucideArrowLeft,
    LucideCalendarDays,
    LucideClock3,
    LucidePlus,
    LucideTriangleAlert,
    LucideUserX,
    Modal,
    PageHeader,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './patient-detail.html',
})
export class PatientDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(NutritionistApi);
  private readonly toaster = inject(Toaster);
  private readonly patientId = this.route.snapshot.paramMap.get('patientId');

  protected readonly patient = followedPatientResource(signal(this.patientId));
  protected readonly weights = patientWeightRecordsResource(signal(this.patientId));
  protected readonly sexLabels = BIOLOGICAL_SEX_LABELS;
  protected readonly goalLabels = GOAL_LABELS;
  protected readonly confirming = signal(false);
  protected readonly ending = signal(false);
  protected readonly endError = signal<string | null>(null);
  protected readonly weightModalOpen = signal(false);
  protected readonly savingWeight = signal(false);
  protected readonly weightError = signal<string | null>(null);
  protected readonly weightKg = signal('');
  protected readonly recordedOn = signal(new Date().toISOString().slice(0, 10));
  protected readonly notes = signal('');
  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly weightItems = computed(() => this.weights.value()?.items ?? []);

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

    protected openWeightModal(): void {
      this.weightError.set(null);
      this.weightKg.set('');
      this.recordedOn.set(this.today);
      this.notes.set('');
      this.weightModalOpen.set(true);
    }

    protected closeWeightModal(): void {
      if (!this.savingWeight()) this.weightModalOpen.set(false);
    }

    protected async saveWeight(): Promise<void> {
      if (!this.patientId || this.savingWeight()) return;
      const parsedWeight = Number(this.weightKg().replace(',', '.'));
      if (!Number.isFinite(parsedWeight) || parsedWeight < 20 || parsedWeight > 500) {
        this.weightError.set('Informe um peso entre 20 e 500 kg.');
        return;
      }
      if (!this.recordedOn()) {
        this.weightError.set('Informe a data do registro.');
        return;
      }
      if (this.notes().length > 500) {
        this.weightError.set('A observação deve ter no máximo 500 caracteres.');
        return;
      }
      const body: RecordWeightRequest = {
        weightKg: parsedWeight,
        recordedOn: this.recordedOn(),
        notes: this.notes().trim() || null,
      };
      this.savingWeight.set(true);
      this.weightError.set(null);
      try {
        await firstValueFrom(this.api.recordPatientWeight(this.patientId, body));
        this.weightModalOpen.set(false);
        this.toaster.show('Peso registrado com sucesso.');
        this.weights.reload();
        this.patient.reload();
      } catch (error) {
        this.weightError.set(toApiError(error).message);
      } finally {
        this.savingWeight.set(false);
      }
    }

    protected setWeightKg(event: Event): void {
      this.weightKg.set((event.target as HTMLInputElement).value);
    }

    protected setRecordedOn(event: Event): void {
      this.recordedOn.set((event.target as HTMLInputElement).value);
    }

    protected setNotes(event: Event): void {
      this.notes.set((event.target as HTMLTextAreaElement).value);
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

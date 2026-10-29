import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideBadgeCheck,
  LucideCalendarDays,
  LucideSearch,
  LucideTriangleAlert,
  LucideUserX,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../../core/http/api-error';
import { isNotFound } from '../../../core/http/resource-status';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { Modal } from '../../../shared/ui/modal/modal';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { PatientApi, careRelationshipResource } from '../patient-api';

@Component({
  selector: 'app-my-nutritionist',
  imports: [
    Alert,
    Button,
    DatePipe,
    LoadError,
    LucideBadgeCheck,
    LucideCalendarDays,
    LucideSearch,
    LucideTriangleAlert,
    LucideUserX,
    Modal,
    PageHeader,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './my-nutritionist.html',
})
export class MyNutritionistPage {
  private readonly api = inject(PatientApi);
  private readonly toaster = inject(Toaster);

  protected readonly care = careRelationshipResource();
  /** 404 "Você não está em acompanhamento." é estado normal: vira a tela vazia. */
  protected readonly withoutCare = computed(() => isNotFound(this.care.error()));

  protected readonly confirming = signal(false);
  protected readonly ending = signal(false);
  protected readonly endError = signal<string | null>(null);

  protected openConfirm(): void {
    this.endError.set(null);
    this.confirming.set(true);
  }

  protected closeConfirm(): void {
    this.confirming.set(false);
  }

  protected async endCare(): Promise<void> {
    if (this.ending()) {
      return;
    }
    this.ending.set(true);
    this.endError.set(null);
    try {
      await firstValueFrom(this.api.endCareRelationship());
      this.confirming.set(false);
      this.toaster.show('Acompanhamento encerrado.');
      this.care.reload();
    } catch (error) {
      this.endError.set(toApiError(error).message);
    } finally {
      this.ending.set(false);
    }
  }
}

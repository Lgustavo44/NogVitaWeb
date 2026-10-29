import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideInbox, LucideUsers } from '@lucide/angular';
import { goalLabel } from '../../../shared/domain/patient-enums';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { myPatientsResource, pendingRequestsResource } from '../nutritionist-api';
import { NutritionistProfileStore } from '../nutritionist-profile-store';

@Component({
  selector: 'app-nutritionist-home',
  imports: [DatePipe, LoadError, PageHeader, LucideInbox, LucideUsers, RouterLink],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './nutritionist-home.html',
})
export class NutritionistHome {
  protected readonly profile = inject(NutritionistProfileStore).profile;
  /** Só os 5 primeiros no início; a lista completa fica em "Meus pacientes". */
  protected readonly patients = myPatientsResource(signal(''), signal(1), 5);
  protected readonly requests = pendingRequestsResource();
  protected readonly goalLabel = goalLabel;

  protected readonly firstName = computed(() =>
    this.profile.hasValue() ? this.profile.value().name.split(' ')[0] : null,
  );
}

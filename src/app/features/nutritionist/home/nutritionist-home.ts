import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideBarcode,
  LucideClipboardPen,
  LucideClipboardList,
  LucideDynamicIcon,
  LucideInbox,
  LucideSearch,
  LucideUserPen,
  LucideUsers,
} from '@lucide/angular';
import { goalLabel } from '../../../shared/domain/patient-enums';
import { Avatar } from '../../../shared/ui/avatar/avatar';
import { DayPeriodIcon, dayPeriod, greetingText } from '../../../shared/ui/greeting/greeting';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { questionnairesResource } from '../anamnesis/anamnesis-api';
import { myPatientsResource, pendingRequestsResource } from '../nutritionist-api';
import { NutritionistProfileStore } from '../nutritionist-profile-store';

@Component({
  selector: 'app-nutritionist-home',
  imports: [Avatar, DatePipe, DayPeriodIcon, LoadError, LucideDynamicIcon, PageHeader, RouterLink],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './nutritionist-home.html',
})
export class NutritionistHome {
  protected readonly profile = inject(NutritionistProfileStore).profile;
  /** Só os 5 primeiros no início; a lista completa fica em "Meus pacientes". */
  protected readonly patients = myPatientsResource(signal(''), signal(1), 5);
  protected readonly requests = pendingRequestsResource();
  private readonly questionnaires = questionnairesResource();
  protected readonly goalLabel = goalLabel;

  protected readonly stats = [
    {
      label: 'Pacientes em acompanhamento',
      icon: LucideUsers,
      tone: 'bg-info-soft text-info-ink',
      link: '/nutricionista/pacientes',
      total: computed(() => (this.patients.hasValue() ? this.patients.value().totalItems : null)),
      loading: this.patients.isLoading,
    },
    {
      label: 'Solicitações pendentes',
      icon: LucideInbox,
      tone: 'bg-warning-soft text-warning-ink',
      link: '/nutricionista/solicitacoes',
      total: computed(() => (this.requests.hasValue() ? this.requests.value().totalItems : null)),
      loading: this.requests.isLoading,
    },
    {
      label: 'Questionários de anamnese',
      icon: LucideClipboardPen,
      tone: 'bg-success-soft text-success-ink',
      link: '/nutricionista/questionarios',
      total: computed(() =>
        this.questionnaires.hasValue() ? this.questionnaires.value().totalItems : null,
      ),
      loading: this.questionnaires.isLoading,
    },
  ];

  protected readonly shortcuts = [
    {
      label: 'Buscar alimento',
      hint: 'TACO e Open Food Facts',
      icon: LucideSearch,
      link: '/nutricionista/alimentos',
    },
    {
      label: 'Importar por código de barras',
      hint: 'Produtos industrializados',
      icon: LucideBarcode,
      link: '/nutricionista/alimentos/codigo-de-barras',
    },
    {
      label: 'Novo questionário',
      hint: 'Anamnese para enviar aos pacientes',
      icon: LucideClipboardList,
      link: '/nutricionista/questionarios/novo',
    },
    {
      label: 'Editar perfil público',
      hint: 'O que os pacientes veem na busca',
      icon: LucideUserPen,
      link: '/nutricionista/perfil',
    },
  ];

  protected readonly firstName = computed(() =>
    this.profile.hasValue() ? this.profile.value().name.split(' ')[0] : null,
  );
  protected readonly period = dayPeriod(new Date());
  protected readonly greeting = computed(() => greetingText(this.period, this.firstName()));
}

import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  LucideClipboardList,
  LucideHouse,
  LucideScale,
  LucideStethoscope,
  LucideUserRound,
  LucideUserSearch,
  LucideUtensils,
} from '@lucide/angular';
import { AppShell, NavItem } from '../../shared/layout/app-shell/app-shell';
import { PatientProfileStore } from './patient-profile-store';

/** Moldura da área do paciente: o AppShell com o menu do paciente. */
@Component({
  selector: 'app-patient-area',
  imports: [AppShell, RouterOutlet],
  providers: [PatientProfileStore],
  template: `
    <app-shell area="Patient" mobileNav="bottom" [navigation]="navigation" [userName]="userName()">
      <router-outlet />
    </app-shell>
  `,
})
export class PatientArea {
  private readonly profile = inject(PatientProfileStore).profile;

  protected readonly userName = computed(() =>
    this.profile.hasValue() ? this.profile.value().name : null,
  );
  protected readonly navigation: NavItem[] = [
    { label: 'Início', icon: LucideHouse, link: '/paciente', exact: true, bottom: true },
    { label: 'Plano alimentar', shortLabel: 'Plano', icon: LucideUtensils, bottom: true },
    { label: 'Peso', icon: LucideScale, bottom: true },
    { label: 'Encontrar nutricionista', icon: LucideUserSearch },
    { label: 'Minhas solicitações', icon: LucideClipboardList },
    { label: 'Meu nutricionista', shortLabel: 'Nutri', icon: LucideStethoscope, bottom: true },
    {
      label: 'Meu perfil',
      shortLabel: 'Perfil',
      icon: LucideUserRound,
      link: '/paciente/perfil',
      bottom: true,
    },
  ];
}

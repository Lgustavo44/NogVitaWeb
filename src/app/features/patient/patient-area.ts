import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  LucideHouse,
  LucideScale,
  LucideStethoscope,
  LucideUserRound,
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
    { label: 'Início', icon: LucideHouse, link: '/paciente', exact: true },
    { label: 'Plano', icon: LucideUtensils },
    { label: 'Peso', icon: LucideScale },
    { label: 'Nutricionista', shortLabel: 'Nutri', icon: LucideStethoscope },
    { label: 'Perfil', icon: LucideUserRound },
  ];
}

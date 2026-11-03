import { httpResource } from '@angular/common/http';
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
import { apiUrl } from '../../core/http/api-url';
import {
  HealthDataConsentStatus,
  MY_HEALTH_DATA_CONSENT_URL,
} from '../../shared/health-data-consent/health-data-consent';
import { AppShell, NavItem } from '../../shared/layout/app-shell/app-shell';
import { HealthDataConsentPrompt } from './consent/health-data-consent-prompt';
import { PatientProfileStore } from './patient-profile-store';

/**
 * Moldura da área do paciente: o AppShell com o menu do paciente.
 * Sem o aceite da versão atual do termo dos dados de saúde, o pedido de aceite ocupa o lugar das telas.
 */
@Component({
  selector: 'app-patient-area',
  imports: [AppShell, HealthDataConsentPrompt, RouterOutlet],
  providers: [PatientProfileStore],
  template: `
    <app-shell
      area="Patient"
      mobileNav="bottom"
      [navigation]="navigation"
      [userName]="userName()"
      [userPhotoUrl]="photoUrl()"
    >
      @if (pendingConsent(); as status) {
        <app-health-data-consent-prompt
          [status]="status"
          (accepted)="consent.reload()"
          (outdated)="consent.reload()"
        />
      } @else {
        <router-outlet />
      }
    </app-shell>
  `,
})
export class PatientArea {
  private readonly profile = inject(PatientProfileStore).profile;

  // Enquanto carrega, ou se a consulta falhar, as telas aparecem normalmente: o aceite não pode travar a área.
  protected readonly consent = httpResource<HealthDataConsentStatus>(() =>
    apiUrl(MY_HEALTH_DATA_CONSENT_URL),
  );
  protected readonly pendingConsent = computed(() =>
    this.consent.hasValue() && !this.consent.value().accepted ? this.consent.value() : null,
  );

  protected readonly userName = computed(() =>
    this.profile.hasValue() ? this.profile.value().name : null,
  );
  protected readonly photoUrl = computed(() =>
    this.profile.hasValue() ? (this.profile.value().photoUrl ?? null) : null,
  );
  protected readonly navigation: NavItem[] = [
    { label: 'Início', icon: LucideHouse, link: '/paciente', exact: true, bottom: true },
    {
      label: 'Plano alimentar',
      shortLabel: 'Plano',
      icon: LucideUtensils,
      link: '/paciente/plano',
      bottom: true,
    },
    {
      label: 'Peso e evolução',
      shortLabel: 'Evolução',
      icon: LucideScale,
      link: '/paciente/peso',
      bottom: true,
    },
    {
      label: 'Encontrar nutricionista',
      icon: LucideUserSearch,
      link: '/paciente/encontrar-nutricionista',
    },
    {
      label: 'Minhas solicitações',
      icon: LucideClipboardList,
      link: '/paciente/minhas-solicitacoes',
    },
    {
      label: 'Meu nutricionista',
      shortLabel: 'Nutri',
      icon: LucideStethoscope,
      link: '/paciente/meu-nutricionista',
      bottom: true,
    },
    {
      label: 'Meu perfil',
      shortLabel: 'Perfil',
      icon: LucideUserRound,
      link: '/paciente/perfil',
      bottom: true,
    },
  ];
}

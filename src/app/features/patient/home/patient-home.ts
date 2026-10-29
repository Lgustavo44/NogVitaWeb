import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideBell,
  LucideBookOpen,
  LucideCalendarDays,
  LucideChartNoAxesCombined,
  LucideChevronDown,
  LucideCircleHelp,
  LucideClipboardList,
  LucideLogOut,
  LucideMenu,
  LucidePanelLeft,
  LucideScale,
  LucideSearch,
  LucideUserRound,
  LucideUtensils,
  LucideX,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../../core/auth/auth-api';
import { AccessContext, AccessRole } from '../../../core/auth/access-context';
import { PatientGoal, PatientProfile } from '../../../core/auth/auth.models';
import { Session } from '../../../core/auth/session';
import { ApiError, toApiError } from '../../../core/http/api-error';
import { Alert } from '../../../shared/ui/alert/alert';
import { Logo } from '../../../shared/ui/logo/logo';
import { AccessSwitcher } from '../../../shared/ui/access-switcher/access-switcher';
import { ThemeToggle } from '../../../shared/ui/theme-toggle/theme-toggle';

@Component({
  selector: 'app-patient-home',
  imports: [
    Alert,
    AccessSwitcher,
    Logo,
    ThemeToggle,
    LucideBell,
    LucideBookOpen,
    LucideCalendarDays,
    LucideChartNoAxesCombined,
    LucideChevronDown,
    LucideCircleHelp,
    LucideClipboardList,
    LucideLogOut,
    LucideMenu,
    LucidePanelLeft,
    LucideScale,
    LucideSearch,
    LucideUserRound,
    LucideUtensils,
    LucideX,
    RouterLink,
  ],
  host: { class: 'block min-h-dvh bg-canvas text-ink' },
  templateUrl: './patient-home.html',
})
export class PatientHome {
  private readonly authApi = inject(AuthApi);
  private readonly access = inject(AccessContext);
  private readonly router = inject(Router);
  private readonly session = inject(Session);

  protected readonly profile = signal<PatientProfile | null>(null);
  protected readonly failure = signal<ApiError | null>(null);
  protected readonly loading = signal(true);
  protected readonly menuOpen = signal(false);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly availableRoles = this.access.availableRoles;
  protected readonly searchQuery = signal('');
  protected readonly navigation = [
    { label: 'Plano alimentar', route: '/inicio' },
    { label: 'Diário nutricional', route: '/inicio' },
    { label: 'Evolução', route: '/inicio' },
    { label: 'Agenda', route: '/inicio' },
  ];
  protected readonly today = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  protected readonly firstName = computed(() => this.profile()?.name.split(' ')[0] ?? 'Paciente');
  protected readonly goalLabel = computed(() => goalLabels[this.profile()?.goal ?? 'Maintenance']);
  protected readonly routineCount = computed(() => {
    const profile = this.profile();
    return [profile?.wakeUpTime, profile?.bedTime, profile?.trainingTime].filter(Boolean).length;
  });
  protected readonly searchResults = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    if (!query) {
      return [];
    }
    return searchableItems.filter((item) =>
      `${item.label} ${item.description}`.toLocaleLowerCase().includes(query),
    );
  });

  constructor() {
    void this.loadProfile();
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  protected async switchRole(role: AccessRole): Promise<void> {
    this.access.setActiveRole(role);
    await this.router.navigateByUrl(role === 'Patient' ? '/inicio/paciente' : role === 'Admin' ? '/inicio/admin' : '/inicio/nutricionista');
  }

  protected updateSearch(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.searchQuery.set(input.value);
    }
  }

  protected async logout(): Promise<void> {
    const refreshToken = this.session.refreshToken();
    if (refreshToken) {
      try {
        await firstValueFrom(this.authApi.logout(refreshToken));
      } catch {
        // A sessão local deve ser encerrada mesmo se a API estiver indisponível.
      }
    }
    this.session.clear();
    await this.router.navigateByUrl('/login');
  }

  protected formatTime(value: string | null): string {
    return value?.slice(0, 5) ?? 'Não informado';
  }

  private async loadProfile(): Promise<void> {
    try {
      const roles = await this.access.load();
      this.access.setActiveRole('Patient');
      if (!roles.includes('Patient')) {
        await this.router.navigateByUrl('/sem-permissao', { replaceUrl: true });
        return;
      }
      this.profile.set(await firstValueFrom(this.authApi.getPatientProfile()));
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.status === 401) {
        this.session.clear();
        await this.router.navigateByUrl('/sessao-expirada', { replaceUrl: true });
        return;
      }
      this.failure.set(apiError);
    } finally {
      this.loading.set(false);
    }
  }
}

const goalLabels: Record<PatientGoal, string> = {
  WeightLoss: 'Emagrecimento saudável',
  Maintenance: 'Manutenção do peso',
  MuscleGain: 'Ganho de massa muscular',
};

const searchableItems = [
  { label: 'Plano alimentar', description: 'Refeições e metas', target: '#plano-alimentar' },
  { label: 'Diário nutricional', description: 'Registre seu dia', target: '#diario-nutricional' },
  { label: 'Evolução', description: 'Peso e medidas', target: '#evolucao' },
  { label: 'Agenda', description: 'Acompanhe consultas', target: '#agenda' },
  { label: 'Meu acompanhamento', description: 'Perfil e plano alimentar', target: '#acompanhamento' },
  { label: 'Objetivo ativo', description: 'Rotina e horários', target: '#objetivo' },
  { label: 'Avisos', description: 'Informações importantes', target: '#avisos' },
];

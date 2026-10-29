import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  LucideBookOpen,
  LucideCalendarDays,
  LucideClipboardList,
  LucideInbox,
  LucideLogOut,
  LucidePanelLeft,
  LucideUserRound,
  LucideUsers,
  LucideUtensils,
} from '@lucide/angular';
import { AccessContext, AccessRole } from '../../../core/auth/access-context';
import { AuthApi } from '../../../core/auth/auth-api';
import { NutritionistPatientSummary, NutritionistProfile } from '../../../core/auth/auth.models';
import { Session } from '../../../core/auth/session';
import { ApiError, toApiError } from '../../../core/http/api-error';
import { Alert } from '../../../shared/ui/alert/alert';
import { Logo } from '../../../shared/ui/logo/logo';
import { AccessSwitcher } from '../../../shared/ui/access-switcher/access-switcher';
import { ThemeToggle } from '../../../shared/ui/theme-toggle/theme-toggle';

@Component({
  selector: 'app-nutritionist-home',
  imports: [
    Alert,
    AccessSwitcher,
    Logo,
    ThemeToggle,
    LucideBookOpen,
    LucideCalendarDays,
    LucideClipboardList,
    LucideInbox,
    LucideLogOut,
    LucidePanelLeft,
    LucideUserRound,
    LucideUsers,
    LucideUtensils,
  ],
  host: { class: 'block min-h-dvh bg-canvas text-ink' },
  templateUrl: './nutritionist-home.html',
})
export class NutritionistHome {
  private readonly access = inject(AccessContext);
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly session = inject(Session);

  protected readonly roles = this.access.availableRoles;
  protected readonly profile = signal<NutritionistProfile | null>(null);
  protected readonly patients = signal<NutritionistPatientSummary[]>([]);
  protected readonly failure = signal<ApiError | null>(null);
  protected readonly loading = signal(true);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly firstName = computed(() => this.profile()?.name.split(' ')[0] ?? 'Nutricionista');

  constructor() {
    void this.load();
  }

  protected async switchRole(role: AccessRole): Promise<void> {
    this.access.setActiveRole(role);
    await this.router.navigateByUrl(role === 'Patient' ? '/inicio/paciente' : role === 'Admin' ? '/inicio/admin' : '/inicio/nutricionista');
  }

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  protected async logout(): Promise<void> {
    const refreshToken = this.session.refreshToken();
    if (refreshToken) {
      try { await firstValueFrom(this.api.logout(refreshToken)); } catch { /* encerra localmente */ }
    }

    this.session.clear();
    await this.router.navigateByUrl('/login');
  }

  private async load(): Promise<void> {
    try {
      const roles = await this.access.load();
      this.access.setActiveRole('Nutritionist');
      if (!roles.includes('Nutritionist')) {
        await this.router.navigateByUrl('/sem-permissao', { replaceUrl: true });
        return;
      }
      const [profile, patients] = await Promise.all([
        firstValueFrom(this.api.getNutritionistProfile()),
        firstValueFrom(this.api.getNutritionistPatients()),
      ]);
      this.profile.set(profile);
      this.patients.set(patients.items);
    } catch (error) {
      this.failure.set(toApiError(error));
    } finally {
      this.loading.set(false);
    }
  }
}

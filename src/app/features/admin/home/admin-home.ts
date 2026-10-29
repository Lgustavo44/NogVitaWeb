import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  LucideActivity,
  LucideClipboardList,
  LucideLayoutDashboard,
  LucideLogOut,
  LucidePanelLeft,
  LucideSearch,
  LucideShieldCheck,
  LucideUtensils,
  LucideUserRound,
  LucideUsers,
} from '@lucide/angular';
import { AccessContext, AccessRole } from '../../../core/auth/access-context';
import { AuthApi } from '../../../core/auth/auth-api';
import { AdminUserSummary } from '../../../core/auth/auth.models';
import { Session } from '../../../core/auth/session';
import { ApiError, toApiError } from '../../../core/http/api-error';
import { Alert } from '../../../shared/ui/alert/alert';
import { Logo } from '../../../shared/ui/logo/logo';
import { AccessSwitcher } from '../../../shared/ui/access-switcher/access-switcher';
import { ThemeToggle } from '../../../shared/ui/theme-toggle/theme-toggle';

@Component({
  selector: 'app-admin-home',
  imports: [
    DatePipe,
    Alert,
    AccessSwitcher,
    Logo,
    ThemeToggle,
    LucideActivity,
    LucideClipboardList,
    LucideLayoutDashboard,
    LucideLogOut,
    LucidePanelLeft,
    LucideSearch,
    LucideShieldCheck,
    LucideUtensils,
    LucideUserRound,
    LucideUsers,
  ],
  host: { class: 'block min-h-dvh bg-canvas text-ink' },
  templateUrl: './admin-home.html',
})
export class AdminHome {
  private readonly access = inject(AccessContext);
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly session = inject(Session);

  protected readonly roles = this.access.availableRoles;
  protected readonly users = signal<AdminUserSummary[]>([]);
  protected readonly failure = signal<ApiError | null>(null);
  protected readonly loading = signal(true);
  protected readonly searchQuery = signal('');
  protected readonly sidebarCollapsed = signal(false);
  protected readonly activeUsers = computed(() => this.users().filter((user) => user.isActive).length);
  protected readonly patients = computed(() => this.users().filter((user) => user.isPatient).length);
  protected readonly nutritionists = computed(() => this.users().filter((user) => user.isNutritionist).length);
  protected readonly filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    return query
      ? this.users().filter((user) => `${user.name} ${user.email}`.toLocaleLowerCase().includes(query))
      : this.users();
  });
  protected readonly invitedNutritionists = computed(() =>
    this.users().filter((user) => user.isNutritionist).slice(0, 5),
  );

  constructor() {
    void this.load();
  }

  protected async switchRole(role: AccessRole): Promise<void> {
    this.access.setActiveRole(role);
    await this.router.navigateByUrl(role === 'Patient' ? '/inicio/paciente' : role === 'Nutritionist' ? '/inicio/nutricionista' : '/inicio/admin');
  }

  protected updateSearch(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.searchQuery.set(input.value);
    }
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
      this.access.setActiveRole('Admin');
      if (!roles.includes('Admin')) {
        await this.router.navigateByUrl('/sem-permissao', { replaceUrl: true });
        return;
      }
      this.users.set((await firstValueFrom(this.api.getAdminUsers())).items);
    } catch (error) {
      this.failure.set(toApiError(error));
    } finally {
      this.loading.set(false);
    }
  }
}

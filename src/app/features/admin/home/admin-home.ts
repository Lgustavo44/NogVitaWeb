import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  LucideDynamicIcon,
  LucideSearch,
  LucideStethoscope,
  LucideUserCheck,
  LucideUserRound,
  LucideUsers,
} from '@lucide/angular';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { adminTotalResource, adminUsersResource } from '../admin-api';

const SEARCH_DEBOUNCE_MS = 350;

@Component({
  selector: 'app-admin-home',
  imports: [DatePipe, LoadError, LucideDynamicIcon, LucideSearch],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './admin-home.html',
})
export class AdminHome {
  /** O termo vai para a API só depois de a pessoa parar de digitar. */
  protected readonly search = signal('');
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly totals = [
    { label: 'Usuários', icon: LucideUsers, resource: adminTotalResource('users') },
    {
      label: 'Usuários ativos',
      icon: LucideUserCheck,
      resource: adminTotalResource('users', { isActive: true }),
    },
    { label: 'Pacientes', icon: LucideUserRound, resource: adminTotalResource('patients') },
    {
      label: 'Nutricionistas',
      icon: LucideStethoscope,
      resource: adminTotalResource('nutritionists'),
    },
  ];
  protected readonly users = adminUsersResource(this.search);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
  }

  protected onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.search.set(value), SEARCH_DEBOUNCE_MS);
  }

  protected roles(user: { isAdmin: boolean; isNutritionist: boolean; isPatient: boolean }): string {
    return [
      user.isAdmin ? 'Admin' : null,
      user.isNutritionist ? 'Nutricionista' : null,
      user.isPatient ? 'Paciente' : null,
    ]
      .filter(Boolean)
      .join(' · ');
  }
}

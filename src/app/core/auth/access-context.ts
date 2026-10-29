import { DOCUMENT } from '@angular/common';
import { Service, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from './auth-api';

export type AccessRole = 'Admin' | 'Nutritionist' | 'Patient';

const STORAGE_KEY = 'nogvita-active-role';
const roleOrder: AccessRole[] = ['Admin', 'Nutritionist', 'Patient'];

@Service()
export class AccessContext {
  private readonly authApi = inject(AuthApi);
  private readonly document = inject(DOCUMENT);
  private readonly roles = signal<AccessRole[]>([]);
  private readonly active = signal<AccessRole | null>(this.readActiveRole());

  readonly availableRoles = computed(() => this.roles());
  readonly activeRole = computed(() => this.active());

  async load(): Promise<AccessRole[]> {
    const response = await firstValueFrom(this.authApi.getCurrentUser());
    const roles = (response?.roles ?? []).filter(isAccessRole);
    this.roles.set(roles);

    const stored = this.active();
    const nextRole = stored && roles.includes(stored) ? stored : roles[0] ?? null;
    this.setActiveRole(nextRole);
    return roles;
  }

  setActiveRole(role: AccessRole | null): void {
    this.active.set(role);
    if (role) {
      this.document.defaultView?.sessionStorage.setItem(STORAGE_KEY, role);
    } else {
      this.document.defaultView?.sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  private readActiveRole(): AccessRole | null {
    const stored = this.document.defaultView?.sessionStorage.getItem(STORAGE_KEY);
    return stored && isAccessRole(stored) ? stored : null;
  }
}

function isAccessRole(value: string): value is AccessRole {
  return roleOrder.includes(value as AccessRole);
}

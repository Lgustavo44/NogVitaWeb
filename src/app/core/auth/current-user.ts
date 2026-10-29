import { Service, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from './auth-api';
import { Role } from './auth.models';

interface UserInfo {
  userId: string;
  roles: Role[];
}

const KNOWN_ROLES: readonly Role[] = ['Patient', 'Nutritionist', 'Admin'];

/**
 * Quem está logado e quais papéis tem (`GET /auth/me`).
 * Carrega uma vez por sessão: chamadas simultâneas reaproveitam a mesma requisição.
 *
 * A API não tem "papel ativo": o token vale para todos os papéis do usuário e cada endpoint
 * confere o seu. A área em que a pessoa está é só uma escolha de tela, e quem a define é a URL.
 */
@Service()
export class CurrentUser {
  private readonly authApi = inject(AuthApi);
  private readonly info = signal<UserInfo | null>(null);
  private pending: Promise<UserInfo> | null = null;

  readonly userId = computed(() => this.info()?.userId ?? null);
  readonly roles = computed(() => this.info()?.roles ?? []);

  load(): Promise<UserInfo> {
    const loaded = this.info();
    if (loaded) {
      return Promise.resolve(loaded);
    }
    this.pending ??= firstValueFrom(this.authApi.me())
      .then((response) => {
        const info: UserInfo = {
          userId: response.userId,
          roles: KNOWN_ROLES.filter((role) => response.roles.includes(role)),
        };
        this.info.set(info);
        return info;
      })
      .finally(() => (this.pending = null));
    return this.pending;
  }

  hasRole(role: Role): boolean {
    return this.roles().includes(role);
  }

  /** Esquece o usuário (logout, troca de conta ou sessão expirada). */
  reset(): void {
    this.info.set(null);
    this.pending = null;
  }
}

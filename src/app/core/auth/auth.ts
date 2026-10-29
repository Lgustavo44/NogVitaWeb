import { Service, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApi } from './auth-api';
import { AuthResponse } from './auth.models';
import { CurrentUser } from './current-user';
import { Session } from './session';

/** Começo e fim da sessão, num lugar só. */
@Service()
export class Auth {
  private readonly authApi = inject(AuthApi);
  private readonly currentUser = inject(CurrentUser);
  private readonly router = inject(Router);
  private readonly session = inject(Session);

  start(tokens: AuthResponse): void {
    this.currentUser.reset();
    this.session.store(tokens);
  }

  /** Encerra na hora, sem esperar a API (o logout é idempotente e pode falhar sem problema). */
  async logout(redirectTo = '/login'): Promise<void> {
    const refreshToken = this.session.refreshToken();
    this.clearLocal();
    if (refreshToken) {
      this.authApi.logout(refreshToken).subscribe({ error: () => undefined });
    }
    await this.router.navigateByUrl(redirectTo);
  }

  /** O refresh foi recusado: a sessão acabou (expirou, foi revogada ou a conta foi desativada). */
  async expire(): Promise<void> {
    this.clearLocal();
    await this.router.navigateByUrl('/sessao-expirada');
  }

  clearLocal(): void {
    this.session.clear();
    this.currentUser.reset();
  }
}

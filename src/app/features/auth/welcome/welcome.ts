import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideLogOut } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../../core/auth/auth-api';
import { Session } from '../../../core/auth/session';
import { Button } from '../../../shared/ui/button/button';

/** Provisória: destino depois do login, até existir a escolha de área. */
@Component({
  selector: 'app-welcome',
  imports: [Button, LucideLogOut],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <div class="flex flex-col gap-2 text-center">
      <h1 class="text-headline-lg text-ink">Você entrou!</h1>
      <p class="text-body-md text-ink-muted">
        As áreas do paciente, do nutricionista e do admin chegam nas próximas etapas.
      </p>
    </div>
    <button appButton variant="forest" type="button" block [loading]="leaving()" (click)="logout()">
      <svg lucideLogOut class="size-5"></svg>
      Sair
    </button>
  `,
})
export class Welcome {
  private readonly authApi = inject(AuthApi);
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  protected readonly leaving = signal(false);

  protected async logout(): Promise<void> {
    this.leaving.set(true);
    const refreshToken = this.session.refreshToken();
    try {
      if (refreshToken) {
        await firstValueFrom(this.authApi.logout(refreshToken));
      }
    } catch {
      // A API pode falhar: os tokens locais são apagados de qualquer jeito.
    } finally {
      this.session.clear();
      await this.router.navigateByUrl('/login');
    }
  }
}

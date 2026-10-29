import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideMailPlus,
  LucideShieldCheck,
  LucideStethoscope,
  LucideUserRound,
  LucideUserX,
} from '@lucide/angular';
import { Observable, firstValueFrom } from 'rxjs';
import { CurrentUser } from '../../../core/auth/current-user';
import { errorSummary } from '../../../core/http/api-error';
import { BIOLOGICAL_SEX_LABELS, goalLabel } from '../../../shared/domain/patient-enums';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { parseIsoDate } from '../../../shared/util/dates';
import { AdminApi, adminUserResource } from '../admin-api';
import { AccountBadge } from '../ui/account-badge';

type Action = 'deactivate' | 'activate' | 'resend' | 'cancel-invite';

/**
 * Detalhe de uma conta: dados, perfis de paciente e de nutricionista, ativar/desativar e,
 * para nutricionista com convite pendente, reenviar o convite ou cancelar o pré-cadastro.
 */
@Component({
  selector: 'app-admin-user-detail',
  imports: [
    AccountBadge,
    Alert,
    Button,
    ConfirmDialog,
    DatePipe,
    LoadError,
    LucideArrowLeft,
    LucideMailPlus,
    LucideShieldCheck,
    LucideStethoscope,
    LucideUserRound,
    LucideUserX,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './admin-user-detail.html',
})
export class AdminUserDetailPage {
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  private readonly toaster = inject(Toaster);
  private readonly currentUserId = inject(CurrentUser).userId;
  protected readonly id = signal(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly user = adminUserResource(this.id);
  protected readonly sexLabels = BIOLOGICAL_SEX_LABELS;
  protected readonly goalLabel = goalLabel;

  protected readonly isSelf = computed(
    () => this.id() !== null && this.id() === this.currentUserId(),
  );
  /** Nutricionista que ainda não aceitou o convite (o perfil fica inativo até lá). */
  protected readonly invitePending = computed(
    () => this.user.hasValue() && this.user.value().nutritionist?.isActive === false,
  );

  protected readonly action = signal<Action | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  /** O convite foi gerado, mas o e-mail falhou: fica na tela até a próxima tentativa. */
  protected readonly emailFailed = signal(false);

  protected ask(action: Action): void {
    this.error.set(null);
    this.action.set(action);
  }

  protected close(): void {
    if (!this.busy()) {
      this.action.set(null);
    }
  }

  protected age(birthDate: string): number {
    const birth = parseIsoDate(birthDate);
    const today = new Date();
    const hadBirthday =
      today.getMonth() > birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    return today.getFullYear() - birth.getFullYear() - (hadBirthday ? 0 : 1);
  }

  protected date(iso: string): Date {
    return parseIsoDate(iso);
  }

  protected async confirm(): Promise<void> {
    const action = this.action();
    const id = this.id();
    if (!action || !id || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      switch (action) {
        case 'deactivate':
          await this.run(this.api.deactivateUser(id), 'Conta desativada.');
          break;
        case 'activate':
          await this.run(this.api.activateUser(id), 'Conta reativada.');
          break;
        case 'resend': {
          const response = await firstValueFrom(this.api.resendInvitation(id));
          this.emailFailed.set(!response.invitationEmailSent);
          this.action.set(null);
          if (response.invitationEmailSent) {
            this.toaster.show('Convite reenviado. O link anterior deixou de valer.');
          }
          break;
        }
        case 'cancel-invite':
          await firstValueFrom(this.api.cancelPreRegistration(id));
          this.action.set(null);
          this.toaster.show('Pré-cadastro cancelado.');
          await this.router.navigateByUrl('/admin/nutricionistas');
          break;
      }
    } catch (error) {
      this.error.set(errorSummary(error));
    } finally {
      this.busy.set(false);
    }
  }

  private async run(request: Observable<void>, success: string): Promise<void> {
    await firstValueFrom(request);
    this.action.set(null);
    this.toaster.show(success);
    this.user.reload();
  }
}

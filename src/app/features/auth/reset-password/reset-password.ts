import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FieldTree,
  FormField,
  FormRoot,
  TreeValidationResult,
  form,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideCheck, LucideEye, LucideEyeOff, LucideLock } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../../core/auth/auth-api';
import { ApiError, toApiError, toFieldErrors } from '../../../core/http/api-error';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { FieldInput } from '../../../shared/ui/field/field-input';
import { Logo } from '../../../shared/ui/logo/logo';

interface ResetPasswordModel {
  newPassword: string;
  confirmation: string;
}

@Component({
  selector: 'app-reset-password',
  imports: [
    Alert,
    Button,
    Field,
    FieldInput,
    FormField,
    FormRoot,
    Logo,
    LucideArrowLeft,
    LucideCheck,
    LucideEye,
    LucideEyeOff,
    LucideLock,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './reset-password.html',
})
export class ResetPassword {
  private readonly authApi = inject(AuthApi);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly token = this.readToken();

  constructor() {
    if (!this.token) {
      void this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }

  protected readonly model = signal<ResetPasswordModel>({ newPassword: '', confirmation: '' });
  protected readonly resetForm = form(
    this.model,
    (path) => {
      required(path.newPassword, { message: 'Informe sua nova senha.' });
      minLength(path.newPassword, 15, { message: 'A senha deve ter pelo menos 15 caracteres.' });
      required(path.confirmation, { message: 'Confirme sua nova senha.' });
      validate(path.confirmation, ({ value }) =>
        value() === '' || value() === this.model().newPassword
          ? undefined
          : { kind: 'password-match', message: 'As senhas precisam ser iguais.' },
      );
    },
    { name: 'password-reset-confirm', submission: { action: (fieldTree) => this.reset(fieldTree) } },
  );

  protected readonly failure = signal<ApiError | null>(null);
  protected readonly completed = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly showConfirmation = signal(false);

  protected togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  protected toggleConfirmation(): void {
    this.showConfirmation.update((visible) => !visible);
  }

  private async reset(
    fieldTree: FieldTree<ResetPasswordModel>,
  ): Promise<TreeValidationResult> {
    this.failure.set(null);

    if (!this.token) {
      this.failure.set({
        status: 400,
        message: 'Link de redefinição inválido ou expirado.',
        fieldErrors: {},
      });
      return undefined;
    }

    try {
      await firstValueFrom(
        this.authApi.confirmPasswordReset({
          token: this.token,
          newPassword: this.model().newPassword,
        }),
      );
      this.completed.set(true);
      return undefined;
    } catch (error) {
      const apiError = toApiError(error);
      this.failure.set(apiError);
      return toFieldErrors(apiError, { newPassword: fieldTree.newPassword });
    }
  }

  private readToken(): string | null {
    const hash = this.document.defaultView?.location.hash ?? '';
    const token = /(?:^|[#&?])token=([A-Za-z0-9_-]+)/.exec(hash)?.[1] ?? null;
    if (token) {
      this.document.defaultView?.history.replaceState(null, '', `${this.document.defaultView.location.pathname}${this.document.defaultView.location.search}`);
    }
    return token;
  }
}

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
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideCheck,
  LucideEye,
  LucideEyeOff,
  LucideLock,
  LucideMail,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../../core/auth/auth-api';
import { takeFragmentToken } from '../../../core/auth/fragment-token';
import { ApiError, toApiError, toFieldErrors } from '../../../core/http/api-error';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { FieldInput } from '../../../shared/ui/field/field-input';
import { Logo } from '../../../shared/ui/logo/logo';

interface InvitationModel {
  password: string;
}

@Component({
  selector: 'app-nutritionist-invitation',
  imports: [
    Alert,
    Button,
    Field,
    FieldInput,
    FormField,
    FormRoot,
    Logo,
    LucideArrowRight,
    LucideCheck,
    LucideEye,
    LucideEyeOff,
    LucideLock,
    LucideMail,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './nutritionist-invitation.html',
})
export class NutritionistInvitation {
  private readonly authApi = inject(AuthApi);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly token = this.readToken();

  protected readonly model = signal<InvitationModel>({ password: '' });
  protected readonly invitationForm = form(
    this.model,
    (path) => {
      required(path.password, {
        message: 'Informe uma senha para ativar sua conta.',
        when: () => this.needsPassword(),
      });
      minLength(path.password, 15, {
        message: 'A senha deve ter pelo menos 15 caracteres.',
        when: () => this.needsPassword(),
      });
    },
    {
      name: 'nutritionist-invitation',
      submission: { action: (fieldTree) => this.accept(fieldTree) },
    },
  );

  protected readonly failure = signal<ApiError | null>(null);
  protected readonly needsPassword = signal(false);
  protected readonly accepted = signal(false);
  protected readonly showPassword = signal(false);

  constructor() {
    if (!this.token) {
      void this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }

  protected togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  private async accept(fieldTree: FieldTree<InvitationModel>): Promise<TreeValidationResult> {
    this.failure.set(null);

    if (!this.token) {
      void this.router.navigateByUrl('/login', { replaceUrl: true });
      return undefined;
    }

    try {
      await firstValueFrom(
        this.authApi.acceptNutritionistInvitation({
          token: this.token,
          password: this.needsPassword() ? this.model().password : null,
        }),
      );
      this.accepted.set(true);
      return undefined;
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.message.toLowerCase().includes('defina uma senha')) {
        this.needsPassword.set(true);
        return undefined;
      }

      this.failure.set(apiError);
      return toFieldErrors(apiError, { password: fieldTree.password });
    }
  }

  private readToken(): string | null {
    return takeFragmentToken(this.document.defaultView);
  }
}

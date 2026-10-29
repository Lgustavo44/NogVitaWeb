import { Component, inject, signal } from '@angular/core';
import {
  FieldTree,
  FormField,
  FormRoot,
  TreeValidationResult,
  email,
  form,
  required,
} from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideKeyRound, LucideMail, LucideSend } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../../core/auth/auth-api';
import { ApiError, toApiError, toFieldErrors } from '../../../core/http/api-error';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { FieldInput } from '../../../shared/ui/field/field-input';
import { Logo } from '../../../shared/ui/logo/logo';

@Component({
  selector: 'app-forgot-password',
  imports: [
    Alert,
    Button,
    Field,
    FieldInput,
    FormField,
    FormRoot,
    Logo,
    LucideArrowLeft,
    LucideKeyRound,
    LucideMail,
    LucideSend,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private readonly authApi = inject(AuthApi);

  protected readonly model = signal({ email: '' });
  protected readonly requestForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'Informe seu e-mail.' });
      email(path.email, { message: 'Informe um e-mail válido.' });
    },
    { name: 'password-reset-request', submission: { action: (fieldTree) => this.request(fieldTree) } },
  );

  protected readonly failure = signal<ApiError | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  private async request(fieldTree: FieldTree<{ email: string }>): Promise<TreeValidationResult> {
    this.failure.set(null);

    try {
      const response = await firstValueFrom(this.authApi.requestPasswordReset(this.model().email));
      this.successMessage.set(response.message);
      return undefined;
    } catch (error) {
      const apiError = toApiError(error);
      this.failure.set(apiError);
      return toFieldErrors(apiError, { email: fieldTree.email });
    }
  }
}

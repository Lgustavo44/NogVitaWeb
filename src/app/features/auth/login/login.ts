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
import { Router, RouterLink } from '@angular/router';
import {
  LucideEye,
  LucideEyeOff,
  LucideLock,
  LucideLogIn,
  LucideMail,
  LucideMailCheck,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../../../core/auth/auth';
import { AuthApi } from '../../../core/auth/auth-api';
import { LoginRequest } from '../../../core/auth/auth.models';
import { ApiError, toApiError, toFieldErrors } from '../../../core/http/api-error';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { FieldInput } from '../../../shared/ui/field/field-input';
import { Logo } from '../../../shared/ui/logo/logo';

type ResendState = 'idle' | 'sending' | 'sent';

@Component({
  selector: 'app-login',
  imports: [
    Alert,
    Button,
    Field,
    FieldInput,
    FormField,
    FormRoot,
    Logo,
    LucideEye,
    LucideEyeOff,
    LucideLock,
    LucideLogIn,
    LucideMail,
    LucideMailCheck,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);

  protected readonly model = signal<LoginRequest>({ email: '', password: '' });
  protected readonly loginForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'Informe seu e-mail.' });
      email(path.email, { message: 'Informe um e-mail válido.' });
      required(path.password, { message: 'Informe sua senha.' });
    },
    { name: 'login', submission: { action: (fieldTree) => this.signIn(fieldTree) } },
  );

  protected readonly failure = signal<ApiError | null>(null);
  protected readonly needsEmailConfirmation = signal(false);
  protected readonly resendState = signal<ResendState>('idle');
  protected readonly showPassword = signal(false);

  protected togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  protected async resendConfirmation(): Promise<void> {
    this.resendState.set('sending');
    try {
      await firstValueFrom(this.authApi.resendEmailConfirmation(this.model().email));
      this.resendState.set('sent');
    } catch (error) {
      this.resendState.set('idle');
      this.failure.set(toApiError(error));
    }
  }

  private async signIn(fieldTree: FieldTree<LoginRequest>): Promise<TreeValidationResult> {
    this.failure.set(null);
    this.needsEmailConfirmation.set(false);
    this.resendState.set('idle');

    try {
      const tokens = await firstValueFrom(this.authApi.login(this.model()));
      this.auth.start(tokens);
      await this.router.navigateByUrl('/inicio');
      return undefined;
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.status === 403) {
        this.needsEmailConfirmation.set(true);
        return undefined;
      }
      this.failure.set(apiError);
      return toFieldErrors(apiError, { email: fieldTree.email, password: fieldTree.password });
    }
  }
}

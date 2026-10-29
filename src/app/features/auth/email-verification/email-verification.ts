import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideCheck, LucideCircleAlert, LucideRefreshCw, LucideSend } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../../core/auth/auth-api';
import { ApiError, toApiError } from '../../../core/http/api-error';
import { Alert } from '../../../shared/ui/alert/alert';
import { Logo } from '../../../shared/ui/logo/logo';

type VerificationState = 'loading' | 'success' | 'expired' | 'missing';

@Component({
  selector: 'app-email-verification',
  imports: [Alert, Logo, LucideArrowLeft, LucideCheck, LucideCircleAlert, LucideRefreshCw, LucideSend, RouterLink],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './email-verification.html',
})
export class EmailVerification {
  private readonly authApi = inject(AuthApi);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly token = this.readToken();

  protected readonly state = signal<VerificationState>(this.token ? 'loading' : 'missing');
  protected readonly failure = signal<ApiError | null>(null);

  constructor() {
    if (this.token) {
      void this.confirm();
    } else {
      void this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }

  private async confirm(): Promise<void> {
    try {
      await firstValueFrom(this.authApi.confirmEmail(this.token!));
      this.state.set('success');
    } catch (error) {
      const apiError = toApiError(error);
      this.failure.set(apiError);
      this.state.set(apiError.status === 400 ? 'expired' : 'missing');
    }
  }

  private readToken(): string | null {
    const window = this.document.defaultView;
    const hash = window?.location.hash ?? '';
    const token = /(?:^|[#&?])token=([A-Za-z0-9_-]+)/.exec(hash)?.[1] ?? null;
    if (token && window) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
    return token;
  }
}

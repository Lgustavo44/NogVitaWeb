import { Component, inject, input, output, signal } from '@angular/core';
import { LucideShieldCheck } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../../core/http/api-error';
import {
  HealthDataConsentApi,
  HealthDataConsentStatus,
} from '../../../shared/health-data-consent/health-data-consent';
import { HealthDataConsentChecks } from '../../../shared/health-data-consent/health-data-consent-checks';
import { Button } from '../../../shared/ui/button/button';

/**
 * Para quem se cadastrou antes do termo (ou de uma versão nova): ocupa a área do paciente até o aceite.
 * Também é o aviso "com destaque" da mudança da política (LGPD, art. 8º, §6º).
 */
@Component({
  selector: 'app-health-data-consent-prompt',
  imports: [Button, HealthDataConsentChecks, LucideShieldCheck],
  host: { class: 'mx-auto flex w-full max-w-2xl flex-col gap-5' },
  template: `
    <section
      class="flex flex-col gap-5 rounded-container bg-surface p-5 shadow-1 sm:p-6"
      aria-labelledby="termo-saude-titulo"
    >
      <div class="flex items-start gap-3">
        <span
          class="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft/40 text-link"
          aria-hidden="true"
        >
          <svg lucideShieldCheck class="size-5"></svg>
        </span>
        <div>
          <h1 id="termo-saude-titulo" class="text-headline-lg text-ink">
            Atualizamos a nossa Política de Privacidade
          </h1>
          <p class="mt-1 text-body-md text-ink-muted">
            Agora pedimos duas autorizações separadas para os seus dados de saúde. Leia e autorize
            para continuar usando o NogVita. O que mudou está no topo da
            <a
              href="/legal/politica-de-privacidade.pdf"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-link hover:underline"
              >Política de Privacidade</a
            >.
          </p>
        </div>
      </div>

      <app-health-data-consent-checks
        [term]="status()"
        [(healthData)]="healthData"
        [(internationalTransfer)]="internationalTransfer"
      />

      @if (error(); as message) {
        <p class="text-body-sm text-danger-ink" role="alert">{{ message }}</p>
      }

      <p class="text-body-sm text-ink-muted">
        Se não concordar, você pode pedir a exclusão da conta pelo e-mail gustadev44&#64;gmail.com.
      </p>

      <div>
        <button
          appButton
          type="button"
          [loading]="saving()"
          [disabled]="!healthData() || !internationalTransfer()"
          (click)="accept()"
        >
          <svg lucideShieldCheck class="size-5"></svg>
          Autorizar e continuar
        </button>
      </div>
    </section>
  `,
})
export class HealthDataConsentPrompt {
  private readonly api = inject(HealthDataConsentApi);

  readonly status = input.required<HealthDataConsentStatus>();
  /** Aceito: a área recarrega o status e mostra as telas de novo. */
  readonly accepted = output();
  /** A versão mudou enquanto a tela estava aberta: a área recarrega o texto. */
  readonly outdated = output();

  protected readonly healthData = signal(false);
  protected readonly internationalTransfer = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async accept(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.api.accept(this.status().version));
      this.accepted.emit();
    } catch (failure) {
      const apiError = toApiError(failure);
      this.error.set(apiError.message);
      if (apiError.status === 422) {
        this.healthData.set(false);
        this.internationalTransfer.set(false);
        this.outdated.emit();
      }
    } finally {
      this.saving.set(false);
    }
  }
}

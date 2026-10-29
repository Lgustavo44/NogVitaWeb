import { Component, computed, input, output } from '@angular/core';
import { LucideRefreshCw } from '@lucide/angular';
import { toApiError } from '../../../core/http/api-error';
import { Alert } from '../alert/alert';
import { Button } from '../button/button';

/** Erro ao carregar um bloco da tela, com a mensagem da API e o botão "Tentar de novo". */
@Component({
  selector: 'app-load-error',
  imports: [Alert, Button, LucideRefreshCw],
  template: `
    <app-alert tone="danger">
      {{ apiError().message }}
      @if (apiError().traceId) {
        <span class="mt-1 block text-body-sm opacity-80"
          >Código do erro: {{ apiError().traceId }}</span
        >
      }
      <div alertActions class="flex pl-5">
        <button appButton variant="ghost" type="button" (click)="retry.emit()">
          <svg lucideRefreshCw class="size-4"></svg>
          Tentar de novo
        </button>
      </div>
    </app-alert>
  `,
})
export class LoadError {
  readonly error = input.required<unknown>();
  readonly retry = output();

  protected readonly apiError = computed(() => toApiError(this.error()));
}

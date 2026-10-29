import { Component, computed, input } from '@angular/core';
import {
  LucideCircleAlert,
  LucideCircleCheck,
  LucideInfo,
  LucideTriangleAlert,
} from '@lucide/angular';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const TONE_CLASSES: Record<AlertTone, string> = {
  info: 'bg-info-soft text-info-ink',
  success: 'bg-success-soft text-success-ink',
  warning: 'bg-warning-soft text-warning-ink',
  danger: 'bg-danger-soft text-danger-ink',
};

/**
 * Mensagem em destaque. O erro usa `role="alert"` (é lido na hora pelo leitor de tela);
 * os demais usam `role="status"`. Para ser anunciado, o alerta deve entrar na tela com `@if`.
 * Ações (botões) vão num elemento com o atributo `alertActions`.
 */
@Component({
  selector: 'app-alert',
  imports: [LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideTriangleAlert],
  host: {
    '[attr.role]': "tone() === 'danger' ? 'alert' : 'status'",
    '[class]': 'classes()',
  },
  template: `
    <div class="flex items-start gap-2.5">
      @switch (tone()) {
        @case ('success') {
          <svg lucideCircleCheck class="mt-0.5 size-5 shrink-0"></svg>
        }
        @case ('warning') {
          <svg lucideTriangleAlert class="mt-0.5 size-5 shrink-0"></svg>
        }
        @case ('danger') {
          <svg lucideCircleAlert class="mt-0.5 size-5 shrink-0"></svg>
        }
        @default {
          <svg lucideInfo class="mt-0.5 size-5 shrink-0"></svg>
        }
      }
      <div class="flex min-w-0 flex-col gap-1">
        @if (heading()) {
          <p class="text-label-lg font-semibold">{{ heading() }}</p>
        }
        <div class="text-body-md"><ng-content /></div>
      </div>
    </div>
    <ng-content select="[alertActions]" />
  `,
})
export class Alert {
  readonly tone = input<AlertTone>('info');
  readonly heading = input<string>();

  protected readonly classes = computed(
    () => `flex flex-col gap-3 rounded-container px-4 py-3 ${TONE_CLASSES[this.tone()]}`,
  );
}

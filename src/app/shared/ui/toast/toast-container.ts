import { Component, inject } from '@angular/core';
import { LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideX } from '@lucide/angular';
import { Toaster } from './toaster';

/** Mostra os avisos do Toaster no canto (no celular, acima da barra inferior). */
@Component({
  selector: 'app-toast-container',
  imports: [LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideX],
  template: `
    <div
      class="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      role="status"
      aria-live="polite"
    >
      @for (toast of toaster.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-container bg-surface-raised px-4 py-3 text-body-md text-ink shadow-3"
        >
          @switch (toast.tone) {
            @case ('danger') {
              <svg lucideCircleAlert class="size-5 shrink-0 text-danger"></svg>
            }
            @case ('info') {
              <svg lucideInfo class="size-5 shrink-0 text-info"></svg>
            }
            @default {
              <svg lucideCircleCheck class="size-5 shrink-0 text-success"></svg>
            }
          }
          <p class="flex-1">{{ toast.message }}</p>
          <button
            type="button"
            class="inline-flex size-8 cursor-pointer items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted"
            aria-label="Fechar aviso"
            (click)="toaster.dismiss(toast.id)"
          >
            <svg lucideX class="size-4"></svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  protected readonly toaster = inject(Toaster);
}

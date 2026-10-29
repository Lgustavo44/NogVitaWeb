import { Component, DOCUMENT, inject } from '@angular/core';
import { LucideRefreshCw } from '@lucide/angular';
import { ServerWake } from './server-wake';

/**
 * Aviso de cold start (tela "Acordando o servidor" do Stitch): aparece por cima de tudo
 * enquanto houver uma requisição lenta. Enquanto o servidor dorme, nada na tela funcionaria mesmo.
 */
@Component({
  selector: 'app-server-wake-banner',
  imports: [LucideRefreshCw],
  template: `
    <div role="status" aria-live="polite">
      @if (serverWake.waking()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-canvas/90 p-4 backdrop-blur-sm"
        >
          <div
            class="flex w-full max-w-md flex-col items-center gap-5 rounded-container bg-surface p-6 text-center shadow-3 sm:p-8"
          >
            <img
              src="/brand/mark.svg"
              alt=""
              width="96"
              height="96"
              class="size-24 motion-safe:animate-[spin_3s_linear_infinite]"
            />
            <div class="flex flex-col gap-2">
              <p class="text-headline-lg text-ink">
                Acordando o servidor, isso pode levar até 1 minuto…
              </p>
              <p class="text-body-md text-ink-muted">
                O servidor fica em espera quando ninguém usa o app por um tempo. Obrigado por
                aguardar.
              </p>
            </div>
            <div
              class="h-1.5 w-full overflow-hidden rounded-pill bg-surface-muted"
              aria-hidden="true"
            >
              <div class="nv-wake-bar h-full w-2/5 rounded-pill bg-primary"></div>
            </div>
            <button
              type="button"
              class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-3 text-label-lg text-ink-muted hover:text-ink"
              (click)="reload()"
            >
              <svg lucideRefreshCw class="size-4"></svg>
              Recarregar página
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .nv-wake-bar {
      animation: nv-wake 1.4s ease-in-out infinite;
    }
    @keyframes nv-wake {
      from {
        transform: translateX(-100%);
      }
      to {
        transform: translateX(250%);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .nv-wake-bar {
        animation: none;
        width: 100%;
        opacity: 0.6;
      }
    }
  `,
})
export class ServerWakeBanner {
  protected readonly serverWake = inject(ServerWake);
  private readonly document = inject(DOCUMENT);

  protected reload(): void {
    this.document.defaultView?.location.reload();
  }
}

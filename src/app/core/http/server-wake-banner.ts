import { Component, inject } from '@angular/core';
import { LucideLoaderCircle } from '@lucide/angular';
import { ServerWake } from './server-wake';

@Component({
  selector: 'app-server-wake-banner',
  imports: [LucideLoaderCircle],
  template: `
    <div role="status" aria-live="polite">
      @if (serverWake.waking()) {
        <div
          class="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-forest px-4 py-2 text-center text-body-md text-on-forest shadow-2"
        >
          <svg lucideLoaderCircle class="size-4 shrink-0 animate-spin"></svg>
          <span>Acordando o servidor… A primeira conexão pode levar até 1 minuto.</span>
        </div>
      }
    </div>
  `,
})
export class ServerWakeBanner {
  protected readonly serverWake = inject(ServerWake);
}

import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';

/**
 * Telas sem login: um card centralizado. No celular, o card ocupa a largura toda.
 * Uma rota pode pedir um card mais largo com `data: { layout: 'wide' }` (ex.: cadastro).
 */
@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, ThemeToggle],
  host: { class: 'flex min-h-dvh flex-col bg-canvas' },
  template: `
    <header class="flex justify-end p-2 sm:p-4">
      <app-theme-toggle />
    </header>
    <main class="flex flex-1 items-start justify-center px-4 pb-8 sm:items-center sm:px-6">
      <div
        class="relative w-full overflow-hidden rounded-container bg-surface p-6 shadow-1 sm:p-8"
        [class.max-w-md]="!wide()"
        [class.max-w-xl]="wide()"
      >
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -top-12 -right-12 size-36 rounded-full bg-soft/20 blur-2xl"
        ></div>
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -bottom-10 -left-10 size-28 rounded-full bg-primary/15 blur-xl"
        ></div>
        <div class="relative">
          <router-outlet />
        </div>
      </div>
    </main>
    <footer class="pb-6 text-center text-body-sm text-ink-muted">
      NogVita · Nutrição e saúde conectadas
    </footer>
  `,
})
export class PublicLayout {
  private readonly router = inject(Router);

  protected readonly wide = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.currentLayoutIsWide()),
    ),
    { initialValue: this.currentLayoutIsWide() },
  );

  private currentLayoutIsWide(): boolean {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data['layout'] === 'wide';
  }
}

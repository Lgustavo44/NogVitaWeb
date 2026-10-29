import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';

/** Telas sem login: um card centralizado. No celular, o card ocupa a largura toda. */
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
        class="relative w-full max-w-md overflow-hidden rounded-container bg-surface p-6 shadow-1 sm:p-8"
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
export class PublicLayout {}

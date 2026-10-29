import { DatePipe } from '@angular/common';
import { Component, booleanAttribute, input } from '@angular/core';

/**
 * Cabeçalho das telas das áreas: selo, data de hoje, título e subtítulo.
 * Com `wave`, o título ganha o 👋 (só decorativo, escondido do leitor de tela).
 */
@Component({
  selector: 'app-page-header',
  imports: [DatePipe],
  host: { class: 'flex flex-col gap-2' },
  template: `
    <div class="flex flex-wrap items-center gap-2 text-body-sm text-ink-muted">
      @if (badge()) {
        <span
          class="inline-flex items-center gap-1.5 rounded-pill bg-soft/40 px-3 py-1 text-label-sm text-soft-ink uppercase"
        >
          <span class="size-1.5 rounded-full bg-primary" aria-hidden="true"></span>
          {{ badge() }}
        </span>
      }
      <span>Hoje, {{ today | date: "d 'de' MMMM" }}</span>
    </div>
    <h1 class="text-headline-xl text-ink sm:text-display-lg">
      {{ title() }}
      @if (wave()) {
        <span aria-hidden="true">👋</span>
      }
    </h1>
    @if (subtitle()) {
      <p class="max-w-2xl text-body-lg text-ink-muted">{{ subtitle() }}</p>
    }
    <ng-content />
  `,
})
export class PageHeader {
  readonly badge = input<string>();
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly wave = input(false, { transform: booleanAttribute });

  protected readonly today = new Date();
}

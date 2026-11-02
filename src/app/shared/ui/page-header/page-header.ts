import { DatePipe } from '@angular/common';
import { Component, booleanAttribute, input } from '@angular/core';

/**
 * Cabeçalho das telas das áreas: título e subtítulo.
 * Com `withDate`, mostra a data de hoje acima do título (só nas telas de início).
 * Um elemento com o atributo `headerIcon` aparece ao lado do título (ex.: a saudação do início).
 */
@Component({
  selector: 'app-page-header',
  imports: [DatePipe],
  // items-start: botões projetados no cabeçalho ficam do tamanho do conteúdo, sem esticar.
  host: { class: 'flex flex-col items-start gap-2' },
  template: `
    @if (withDate()) {
      <p class="text-label-md text-ink-muted">Hoje, {{ today | date: "d 'de' MMMM" }}</p>
    }
    <div class="flex items-center gap-3">
      <ng-content select="[headerIcon]" />
      <h1 class="text-headline-xl text-balance text-ink sm:text-display-md">
        {{ title() }}
      </h1>
    </div>
    @if (subtitle()) {
      <p class="max-w-2xl text-body-lg text-pretty text-ink-muted">{{ subtitle() }}</p>
    }
    <ng-content />
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly withDate = input(false, { transform: booleanAttribute });

  protected readonly today = new Date();
}

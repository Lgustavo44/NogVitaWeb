import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  Component,
  DOCUMENT,
  DestroyRef,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { LucideX } from '@lucide/angular';

let nextId = 0;

/**
 * Janela modal acessível: prende o foco, fecha com Esc ou clicando fora e, ao fechar,
 * devolve o foco a quem a abriu. No celular, abre como painel na parte de baixo da tela.
 *
 * Uso: `@if (aberto()) { <app-modal heading="..." (closed)="fechar()"> ... </app-modal> }`
 * Projeções: o conteúdo, `[modalIcon]` ao lado do título e `[modalActions]` no rodapé.
 * Para focar um campo ao abrir, marque-o com `cdkFocusInitial`.
 */
@Component({
  selector: 'app-modal',
  imports: [CdkTrapFocus, LucideX],
  host: { '(document:keydown.escape)': 'requestClose()' },
  template: `
    <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        class="absolute inset-0 bg-forest/50 backdrop-blur-sm"
        aria-hidden="true"
        (click)="requestClose()"
      ></div>
      <section
        [attr.role]="alert() ? 'alertdialog' : 'dialog'"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        class="relative flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-t-container bg-surface shadow-3 sm:max-h-[calc(100dvh-2rem)] sm:rounded-container"
        [class.sm:max-w-md]="size() === 'sm'"
        [class.sm:max-w-xl]="size() === 'md'"
      >
        <header class="flex items-start gap-3 border-b border-divider bg-surface-muted px-5 py-4">
          <ng-content select="[modalIcon]" />
          <div class="min-w-0 flex-1">
            <h2 [id]="titleId" class="text-title-md text-ink">{{ heading() }}</h2>
            @if (subtitle()) {
              <p class="text-body-sm text-ink-muted">{{ subtitle() }}</p>
            }
          </div>
          <button
            type="button"
            class="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-muted hover:bg-surface hover:text-ink disabled:opacity-50"
            aria-label="Fechar"
            [disabled]="busy()"
            (click)="requestClose()"
          >
            <svg lucideX class="size-5"></svg>
          </button>
        </header>
        <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <ng-content />
        </div>
        <footer
          class="flex flex-col-reverse gap-2 border-t border-divider bg-surface-muted p-4 sm:flex-row sm:justify-end"
        >
          <ng-content select="[modalActions]" />
        </footer>
      </section>
    </div>
  `,
})
export class Modal {
  readonly heading = input.required<string>();
  readonly subtitle = input<string>();
  readonly size = input<'sm' | 'md'>('md');
  /** Ação em andamento: não deixa fechar no meio do envio. */
  readonly busy = input(false, { transform: booleanAttribute });
  /** Confirmação de ação destrutiva (leitor de tela anuncia como alerta). */
  readonly alert = input(false, { transform: booleanAttribute });
  readonly closed = output();

  protected readonly titleId = `nv-modal-${nextId++}`;
  private readonly opener = inject(DOCUMENT).activeElement as HTMLElement | null;

  constructor() {
    // Ao sair da tela, o foco volta ao botão que abriu o modal.
    inject(DestroyRef).onDestroy(() => this.opener?.focus?.());
  }

  protected requestClose(): void {
    if (!this.busy()) {
      this.closed.emit();
    }
  }
}

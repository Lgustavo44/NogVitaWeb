import { Component, booleanAttribute, computed, input } from '@angular/core';
import { LucideLoaderCircle } from '@lucide/angular';

export type ButtonVariant = 'primary' | 'soft' | 'forest' | 'ghost';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'px-5 bg-primary text-on-primary shadow-1 hover:bg-primary-hover',
  soft: 'px-5 bg-soft/30 text-soft-ink hover:bg-soft/50',
  forest: 'px-5 bg-forest text-on-forest hover:opacity-90',
  ghost: 'px-3 text-link hover:bg-soft/25',
};

/** Botão nativo com as variantes do design system. Durante o carregamento, fica desabilitado. */
@Component({
  // Componente sobre o <button> nativo (mantém teclado, foco e submit), como faz o Angular Material.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[appButton]',
  imports: [LucideLoaderCircle],
  host: {
    '[class]': 'classes()',
    '[disabled]': 'disabled() || loading()',
    '[attr.aria-busy]': 'loading() || null',
  },
  template: `
    @if (loading()) {
      <svg lucideLoaderCircle class="size-5 animate-spin"></svg>
    }
    <ng-content />
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly block = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() =>
    [
      'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control py-2',
      'text-label-lg font-semibold transition-colors',
      'disabled:cursor-not-allowed disabled:opacity-60',
      VARIANT_CLASSES[this.variant()],
      this.block() ? 'w-full' : '',
    ].join(' '),
  );
}

import { Component, computed, effect, input, signal } from '@angular/core';
import { initialsOf } from '../../util/initials';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<AvatarSize, { px: number; box: string; text: string }> = {
  sm: { px: 32, box: 'size-8', text: 'text-label-md' },
  md: { px: 40, box: 'size-10', text: 'text-label-lg' },
  lg: { px: 56, box: 'size-14', text: 'text-title-md' },
  xl: { px: 96, box: 'size-24', text: 'text-headline-xl' },
};

/**
 * Foto da pessoa, sempre em círculo; sem foto (ou se a imagem falhar, como uma URL assinada
 * que expirou), mostra as iniciais. Decorativo: o nome sempre aparece ao lado.
 */
@Component({
  selector: 'app-avatar',
  host: {
    '[class]': 'hostClasses()',
    'aria-hidden': 'true',
  },
  template: `
    @if (showPhoto()) {
      <img
        class="size-full object-cover"
        [src]="photoUrl()"
        alt=""
        [width]="dimensions().px"
        [height]="dimensions().px"
        loading="lazy"
        decoding="async"
        (error)="failed.set(true)"
      />
    } @else {
      {{ initials() }}
    }
  `,
})
export class Avatar {
  readonly name = input.required<string>();
  readonly photoUrl = input<string | null | undefined>(null);
  readonly size = input<AvatarSize>('md');

  protected readonly failed = signal(false);
  protected readonly dimensions = computed(() => SIZES[this.size()]);
  protected readonly initials = computed(() => initialsOf(this.name()));
  protected readonly showPhoto = computed(() => !!this.photoUrl() && !this.failed());
  protected readonly hostClasses = computed(() =>
    [
      // A linha fina por cima (after) separa fotos claras do card branco, como nas referências.
      'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
      'bg-soft font-bold text-on-soft select-none',
      'after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:ring-1 after:ring-hairline after:ring-inset',
      this.dimensions().box,
      this.dimensions().text,
    ].join(' '),
  );

  constructor() {
    // Uma URL nova (ex.: assinada de novo) merece outra tentativa.
    effect(() => {
      this.photoUrl();
      this.failed.set(false);
    });
  }
}

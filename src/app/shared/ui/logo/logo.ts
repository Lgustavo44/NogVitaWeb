import { NgOptimizedImage } from '@angular/common';
import { Component, booleanAttribute, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/theme/theme.service';

/** `auto` acompanha o tema; `on-dark` é para fundos escuros fixos, como o menu lateral. */
export type LogoTone = 'auto' | 'on-light' | 'on-dark';

@Component({
  selector: 'app-logo',
  imports: [NgOptimizedImage, RouterLink],
  host: { class: 'inline-flex' },
  template: `
    <a routerLink="/" aria-label="Ir para a página inicial" class="inline-flex h-full">
      <img
        [ngSrc]="src()"
        [width]="compact() ? 170 : 496"
        [height]="compact() ? 170 : 150"
        alt="NogVita"
        [priority]="priority()"
        [class.w-full]="compact()"
        [class.object-contain]="compact()"
        [class.w-auto]="!compact()"
      />
    </a>
  `,
})
export class Logo {
  private readonly theme = inject(ThemeService);

  readonly tone = input<LogoTone>('auto');
  readonly compact = input(false, { transform: booleanAttribute });
  readonly priority = input(false, { transform: booleanAttribute });

  protected readonly src = computed(() => {
    const tone = this.tone();
    const onDark = tone === 'on-dark' || (tone === 'auto' && this.theme.resolved() === 'dark');
    if (this.compact()) {
      return onDark ? '/brand/mark-dark.svg' : '/brand/mark.svg';
    }
    return onDark ? '/brand/logo-dark.svg' : '/brand/logo.svg';
  });
}

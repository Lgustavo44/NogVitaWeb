import { NgOptimizedImage } from '@angular/common';
import { Component, booleanAttribute, computed, inject, input } from '@angular/core';
import { ThemeService } from '../../../core/theme/theme.service';

/** `auto` acompanha o tema; `on-dark` é para fundos escuros fixos, como o menu lateral. */
export type LogoTone = 'auto' | 'on-light' | 'on-dark';

@Component({
  selector: 'app-logo',
  imports: [NgOptimizedImage],
  host: { class: 'inline-flex' },
  template: `
    <img
      [ngSrc]="src()"
      width="496"
      height="150"
      alt="NogVita"
      [priority]="priority()"
      class="h-full w-auto"
    />
  `,
})
export class Logo {
  private readonly theme = inject(ThemeService);

  readonly tone = input<LogoTone>('auto');
  readonly priority = input(false, { transform: booleanAttribute });

  protected readonly src = computed(() => {
    const tone = this.tone();
    const onDark = tone === 'on-dark' || (tone === 'auto' && this.theme.resolved() === 'dark');
    return onDark ? '/brand/logo-dark.svg' : '/brand/logo.svg';
  });
}

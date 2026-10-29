import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, booleanAttribute, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/theme/theme.service';

/** `auto` acompanha o tema; `on-dark` é para fundos escuros fixos. */
export type LogoTone = 'auto' | 'on-light' | 'on-dark';

/**
 * A logo oficial. `compact` mostra só a fatia de laranja (menu lateral recolhido, celular).
 * Com `link`, vira um link (ex.: para o início da área); sem ele, é só a imagem.
 */
@Component({
  selector: 'app-logo',
  imports: [NgOptimizedImage, NgTemplateOutlet, RouterLink],
  host: { class: 'inline-flex' },
  template: `
    <ng-template #image>
      <img
        [ngSrc]="src()"
        [width]="compact() ? 170 : 496"
        [height]="compact() ? 170 : 150"
        alt="NogVita"
        [priority]="priority()"
        class="h-full w-auto"
      />
    </ng-template>
    @if (link(); as link) {
      <a
        [routerLink]="link"
        class="inline-flex h-full rounded-control"
        aria-label="NogVita: ir para o início"
      >
        <ng-container [ngTemplateOutlet]="image" />
      </a>
    } @else {
      <ng-container [ngTemplateOutlet]="image" />
    }
  `,
})
export class Logo {
  private readonly theme = inject(ThemeService);

  readonly tone = input<LogoTone>('auto');
  readonly compact = input(false, { transform: booleanAttribute });
  readonly priority = input(false, { transform: booleanAttribute });
  readonly link = input<string | null>(null);

  protected readonly src = computed(() => {
    const tone = this.tone();
    const onDark = tone === 'on-dark' || (tone === 'auto' && this.theme.resolved() === 'dark');
    if (this.compact()) {
      return onDark ? '/brand/mark-dark.svg' : '/brand/mark.svg';
    }
    return onDark ? '/brand/logo-dark.svg' : '/brand/logo.svg';
  });
}

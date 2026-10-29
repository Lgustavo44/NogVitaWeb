import { Component, computed, inject } from '@angular/core';
import { LucideMonitor, LucideMoon, LucideSun } from '@lucide/angular';
import { ThemePreference, ThemeService } from '../../../core/theme/theme.service';

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};
const LABEL: Record<ThemePreference, string> = {
  system: 'igual ao sistema',
  light: 'claro',
  dark: 'escuro',
};

@Component({
  selector: 'app-theme-toggle',
  imports: [LucideMonitor, LucideMoon, LucideSun],
  template: `
    <button
      type="button"
      class="inline-flex size-11 cursor-pointer items-center justify-center rounded-pill text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
      [attr.aria-label]="label()"
      [title]="label()"
      (click)="cycle()"
    >
      @switch (theme.preference()) {
        @case ('light') {
          <svg lucideSun class="size-5"></svg>
        }
        @case ('dark') {
          <svg lucideMoon class="size-5"></svg>
        }
        @default {
          <svg lucideMonitor class="size-5"></svg>
        }
      }
    </button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);

  protected readonly label = computed(() => {
    const current = this.theme.preference();
    return `Tema: ${LABEL[current]}. Mudar para ${LABEL[NEXT[current]]}`;
  });

  protected cycle(): void {
    this.theme.setPreference(NEXT[this.theme.preference()]);
  }
}

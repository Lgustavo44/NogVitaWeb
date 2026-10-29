import { Component, computed, input } from '@angular/core';
import { LucideShieldCheck } from '@lucide/angular';

/**
 * Atribuição das fontes de dados. Obrigatória em toda tela com dados de alimentos:
 * a licença ODbL do Open Food Facts exige, e a TACO pede a citação.
 * Recebe os textos de atribuição que vieram da API (repetidos são mostrados uma vez).
 */
@Component({
  selector: 'app-food-attribution',
  imports: [LucideShieldCheck],
  template: `
    @if (texts().length > 0) {
      <aside
        class="flex items-start gap-3 rounded-container bg-surface-muted p-4 text-body-sm text-ink-muted"
        aria-label="Fonte dos dados nutricionais"
      >
        <svg lucideShieldCheck class="mt-0.5 size-5 shrink-0 text-link"></svg>
        <div class="flex flex-col gap-1">
          <p class="text-label-md text-ink">Fonte dos dados</p>
          @for (text of texts(); track text) {
            <p>{{ text }}</p>
          }
        </div>
      </aside>
    }
  `,
})
export class FoodAttribution {
  readonly attributions = input.required<readonly (string | null)[]>();
  protected readonly texts = computed(() => [
    ...new Set(this.attributions().filter((text): text is string => !!text?.trim())),
  ]);
}

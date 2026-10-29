import { Component, computed, input } from '@angular/core';
import { FOOD_SOURCE_LABELS, FoodSource } from '../domain/food';

/** Selo da fonte do alimento (TACO ou Open Food Facts), sempre com texto (não só cor). */
@Component({
  selector: 'app-source-badge',
  host: { class: 'inline-flex' },
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-label-md whitespace-nowrap"
      [class]="source() === 'Taco' ? 'bg-forest text-on-forest' : 'bg-info-soft text-info-ink'"
    >
      <span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
      {{ label() }}
    </span>
  `,
})
export class SourceBadge {
  readonly source = input.required<FoodSource>();
  protected readonly label = computed(() => FOOD_SOURCE_LABELS[this.source()]);
}

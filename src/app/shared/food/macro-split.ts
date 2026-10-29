import { Component, computed, input } from '@angular/core';
import { NutrientsPer100g } from '../domain/food';
import { NutrientPipe } from './nutrient.pipe';

interface MacroShare {
  key: 'carb' | 'protein' | 'fat';
  label: string;
  /** Espaço estreito (celular, coluna lateral): "Carboidratos" não cabe numa coluna de ~90 px. */
  shortLabel: string;
  grams: number;
  percent: number;
  colorClass: string;
}

/**
 * De onde vêm as calorias: carboidratos e proteínas (4 kcal/g) e gorduras (9 kcal/g).
 * Barra empilhada com 2 px de espaço entre as partes e rótulos com nome e %: a cor não é a única pista.
 * Com algum dos três sem informação, não calcula (mostrar uma divisão incompleta enganaria).
 */
@Component({
  selector: 'app-macro-split',
  imports: [NutrientPipe],
  template: `
    @if (shares(); as shares) {
      <div class="@container flex flex-col gap-3">
        <div
          class="flex h-3 gap-0.5 overflow-hidden rounded-pill"
          role="img"
          [attr.aria-label]="summary()"
        >
          @for (share of shares; track share.key) {
            @if (share.percent > 0) {
              <span
                class="h-full first:rounded-l-pill last:rounded-r-pill"
                [class]="share.colorClass"
                [style.width.%]="share.percent"
              ></span>
            }
          }
        </div>
        <dl class="grid grid-cols-3 gap-2">
          @for (share of shares; track share.key) {
            <div class="flex flex-col rounded-control bg-surface-muted p-3">
              <dt class="flex items-center gap-1.5 text-body-sm text-ink-muted">
                <span
                  class="size-2.5 shrink-0 rounded-full"
                  [class]="share.colorClass"
                  aria-hidden="true"
                ></span>
                <span class="@min-[24rem]:hidden">{{ share.shortLabel }}</span>
                <span class="hidden @min-[24rem]:inline">{{ share.label }}</span>
              </dt>
              <dd class="text-title-md text-ink tabular-nums">{{ share.percent }}%</dd>
              <dd class="text-body-sm text-ink-muted tabular-nums">
                {{ share.grams | nutrient: 'g' }}
              </dd>
            </div>
          }
        </dl>
      </div>
    } @else {
      <p class="rounded-control bg-surface-muted p-3 text-body-sm text-ink-muted">
        Não dá para calcular a divisão das calorias: falta informação de algum macronutriente na
        fonte.
      </p>
    }
  `,
})
export class MacroSplit {
  readonly nutrients = input.required<NutrientsPer100g>();

  protected readonly shares = computed<MacroShare[] | null>(() => {
    const {
      carbohydratePer100g: carb,
      proteinPer100g: protein,
      fatPer100g: fat,
    } = this.nutrients();
    if (carb === null || protein === null || fat === null) {
      return null;
    }
    const kcal = { carb: carb * 4, protein: protein * 4, fat: fat * 9 };
    const total = kcal.carb + kcal.protein + kcal.fat;
    if (total <= 0) {
      return null;
    }
    const percent = (value: number) => Math.round((value / total) * 100);
    return [
      {
        key: 'carb',
        label: 'Carboidratos',
        shortLabel: 'Carb.',
        grams: carb,
        percent: percent(kcal.carb),
        colorClass: 'bg-macro-carb',
      },
      {
        key: 'protein',
        label: 'Proteínas',
        shortLabel: 'Prot.',
        grams: protein,
        percent: percent(kcal.protein),
        colorClass: 'bg-macro-protein',
      },
      {
        key: 'fat',
        label: 'Gorduras',
        shortLabel: 'Gord.',
        grams: fat,
        percent: percent(kcal.fat),
        colorClass: 'bg-macro-fat',
      },
    ];
  });

  protected readonly summary = computed(() => {
    const shares = this.shares();
    return shares
      ? 'Divisão das calorias: ' + shares.map((s) => `${s.label} ${s.percent}%`).join(', ')
      : 'Divisão das calorias indisponível';
  });
}

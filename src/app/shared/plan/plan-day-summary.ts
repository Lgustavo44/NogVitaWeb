import { Component, computed, input } from '@angular/core';
import { NutrientsPer100g } from '../domain/food';
import {
  NutrientComparison,
  NutrientTotal,
  NutrientTotals,
  TargetComparison,
} from '../domain/nutrition-plan';
import { MacroSplit } from '../food/macro-split';
import { NutrientPipe } from '../food/nutrient.pipe';

type Unit = 'kcal' | 'g' | 'mg';

interface TotalRow {
  label: string;
  unit: Unit;
  total: NutrientTotal;
}

interface TargetRow {
  label: string;
  unit: Unit;
  comparison: NutrientComparison;
  percent: number;
}

/**
 * Resumo do dia: totais do plano, comparação com a meta (quando há) e a divisão das calorias.
 * Total incompleto (algum alimento não informa o nutriente) aparece como "pelo menos".
 */
@Component({
  selector: 'app-plan-day-summary',
  imports: [MacroSplit, NutrientPipe],
  host: { class: '@container flex flex-col gap-5' },
  template: `
    @if (targetRows().length > 0) {
      <div class="flex flex-col gap-4">
        <h3 class="text-label-md text-ink-muted uppercase">Planejado × meta</h3>
        @for (row of targetRows(); track row.label) {
          <div class="flex flex-col gap-1.5">
            <div class="flex flex-wrap items-baseline justify-between gap-x-3">
              <span class="text-label-lg text-ink">{{ row.label }}</span>
              <span class="text-body-md text-ink tabular-nums">
                @if (!row.comparison.isComplete) {
                  <span class="text-warning-ink">≥</span>
                }
                {{ row.comparison.planned | nutrient: row.unit }}
                <span class="text-ink-muted"
                  >de {{ row.comparison.target | nutrient: row.unit }}</span
                >
              </span>
            </div>
            <div class="h-2 overflow-hidden rounded-pill bg-surface-muted" aria-hidden="true">
              <div
                class="h-full rounded-pill bg-chart-line"
                [style.width.%]="row.percent > 100 ? 100 : row.percent"
              ></div>
            </div>
            <p class="text-body-sm text-ink-muted tabular-nums">{{ differenceText(row) }}</p>
          </div>
        }
      </div>
    }

    <div class="flex flex-col gap-3">
      <h3 class="text-label-md text-ink-muted uppercase">Total do dia</h3>
      <dl class="grid grid-cols-2 gap-2 @min-[32rem]:grid-cols-3">
        @for (row of totalRows(); track row.label) {
          <div class="rounded-control bg-surface-muted p-3">
            <dt class="text-body-sm text-ink-muted">{{ row.label }}</dt>
            <dd class="text-title-md text-ink tabular-nums">
              @if (!row.total.isComplete) {
                <span class="text-warning-ink" aria-hidden="true">≥</span>
                <span class="sr-only">pelo menos</span>
              }
              {{ row.total.value | nutrient: row.unit }}
            </dd>
          </div>
        }
      </dl>
      @if (hasIncomplete()) {
        <p class="text-body-sm text-warning-ink">
          ≥ = pelo menos: algum alimento não informa esse nutriente na fonte.
        </p>
      }
    </div>

    @if (totals().energyKcal.value > 0) {
      <div class="flex flex-col gap-3">
        <h3 class="text-label-md text-ink-muted uppercase">De onde vêm as calorias</h3>
        <app-macro-split [nutrients]="macros()" />
      </div>
    }
  `,
})
export class PlanDaySummary {
  readonly totals = input.required<NutrientTotals>();
  readonly target = input<TargetComparison | null>(null);

  protected readonly totalRows = computed<TotalRow[]>(() => {
    const totals = this.totals();
    return [
      { label: 'Energia', unit: 'kcal', total: totals.energyKcal },
      { label: 'Carboidratos', unit: 'g', total: totals.carbohydrate },
      { label: 'Proteínas', unit: 'g', total: totals.protein },
      { label: 'Gorduras', unit: 'g', total: totals.fat },
      { label: 'Fibras', unit: 'g', total: totals.fiber },
      { label: 'Sódio', unit: 'mg', total: totals.sodiumMg },
    ];
  });

  protected readonly hasIncomplete = computed(() =>
    this.totalRows().some((row) => !row.total.isComplete),
  );

  protected readonly targetRows = computed<TargetRow[]>(() => {
    const target = this.target();
    if (!target) {
      return [];
    }
    const rows: [string, Unit, NutrientComparison | null][] = [
      ['Energia', 'kcal', target.energyKcal],
      ['Carboidratos', 'g', target.carbohydrate],
      ['Proteínas', 'g', target.protein],
      ['Gorduras', 'g', target.fat],
    ];
    return rows
      .filter((row): row is [string, Unit, NutrientComparison] => row[2] !== null)
      .map(([label, unit, comparison]) => ({
        label,
        unit,
        comparison,
        percent: comparison.target > 0 ? (comparison.planned / comparison.target) * 100 : 0,
      }));
  });

  /** A divisão das calorias usa os totais do dia no formato do MacroSplit. */
  protected readonly macros = computed<NutrientsPer100g>(() => {
    const totals = this.totals();
    const value = (total: NutrientTotal) => (total.isComplete ? total.value : null);
    return {
      energyKcalPer100g: totals.energyKcal.value,
      proteinPer100g: value(totals.protein),
      carbohydratePer100g: value(totals.carbohydrate),
      fatPer100g: value(totals.fat),
      fiberPer100g: totals.fiber.value,
      sodiumMgPer100g: totals.sodiumMg.value,
    };
  });

  /**
   * Diferença em texto (a cor não diz se está bom: depende do objetivo). Calculada pelo
   * planejado e pela meta, sem depender do sinal do `difference` (a doc não define).
   */
  protected differenceText(row: TargetRow): string {
    const difference = row.comparison.planned - row.comparison.target;
    const amount = new NutrientPipe().transform(Math.abs(difference), row.unit);
    const percent = Math.round(row.percent);
    if (Math.abs(difference) < 0.5) {
      return `Na meta (${percent}%)`;
    }
    return difference > 0
      ? `${amount} acima da meta (${percent}%)`
      : `Faltam ${amount} para a meta (${percent}%)`;
  }
}

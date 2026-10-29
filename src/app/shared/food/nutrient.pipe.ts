import { Pipe, PipeTransform } from '@angular/core';

/**
 * Valor nutricional para a tela: "25,8 g", "124 kcal". Sem informação vira "—", nunca "0".
 * Uso: `{{ food.proteinPer100g | nutrient: 'g' }}`.
 */
@Pipe({ name: 'nutrient' })
export class NutrientPipe implements PipeTransform {
  transform(
    value: number | null | undefined,
    unit: 'kcal' | 'g' | 'mg' | 'kJ',
    digits = 1,
  ): string {
    if (value === null || value === undefined) {
      return '—';
    }
    const fraction = unit === 'kcal' || unit === 'kJ' || unit === 'mg' ? 0 : digits;
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: fraction })} ${unit}`;
  }
}

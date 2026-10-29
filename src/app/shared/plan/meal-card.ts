import { Component, booleanAttribute, input, output } from '@angular/core';
import {
  LucideArrowDown,
  LucideArrowUp,
  LucideClock3,
  LucideMoonStar,
  LucidePencil,
  LucidePlus,
  LucideTrash,
} from '@lucide/angular';
import { Meal, MealFood } from '../domain/nutrition-plan';
import { NutrientPipe } from '../food/nutrient.pipe';
import { SourceBadge } from '../food/source-badge';

/**
 * Uma refeição do plano: horário, aviso de horário fora da rotina, observações, alimentos
 * com a porção e o total. Com `editable`, mostra as ações do nutricionista.
 */
@Component({
  selector: 'app-meal-card',
  imports: [
    LucideArrowDown,
    LucideArrowUp,
    LucideClock3,
    LucideMoonStar,
    LucidePencil,
    LucidePlus,
    LucideTrash,
    NutrientPipe,
    SourceBadge,
  ],
  templateUrl: './meal-card.html',
})
export class MealCard {
  readonly meal = input.required<Meal>();
  readonly editable = input(false, { transform: booleanAttribute });
  readonly first = input(false, { transform: booleanAttribute });
  readonly last = input(false, { transform: booleanAttribute });
  /** Reordenando: setas desabilitadas até a API responder. */
  readonly busy = input(false, { transform: booleanAttribute });

  readonly edit = output();
  readonly remove = output();
  readonly moveUp = output();
  readonly moveDown = output();
  readonly addFood = output();
  readonly editFood = output<MealFood>();
  readonly removeFood = output<MealFood>();

  protected time(value: string): string {
    return value.slice(0, 5);
  }

  protected grams(value: number): string {
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} g`;
  }
}

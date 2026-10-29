import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideBarcode, LucideCircleAlert } from '@lucide/angular';
import { NUTRIENTS, kcalToKj } from '../../../shared/domain/food';
import { FoodAttribution } from '../../../shared/food/food-attribution';
import { MacroSplit } from '../../../shared/food/macro-split';
import { NutrientPipe } from '../../../shared/food/nutrient.pipe';
import { SourceBadge } from '../../../shared/food/source-badge';
import { Alert } from '../../../shared/ui/alert/alert';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { foodResource } from './foods-api';

@Component({
  selector: 'app-food-detail',
  imports: [
    Alert,
    FoodAttribution,
    LoadError,
    LucideArrowLeft,
    LucideBarcode,
    LucideCircleAlert,
    MacroSplit,
    NutrientPipe,
    RouterLink,
    SourceBadge,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './food-detail.html',
})
export class FoodDetailPage {
  protected readonly food = foodResource(
    signal(inject(ActivatedRoute).snapshot.paramMap.get('foodId')),
  );
  protected readonly nutrients = NUTRIENTS;
  protected readonly energyKj = computed(() => {
    const kcal = this.food.hasValue() ? this.food.value().energyKcalPer100g : null;
    return kcal === null ? null : kcalToKj(kcal);
  });
}

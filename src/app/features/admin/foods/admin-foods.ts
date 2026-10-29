import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { LucideSearch } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { errorSummary } from '../../../core/http/api-error';
import { FOOD_SEARCH_MIN, FOOD_SOURCE_LABELS, Food, FoodSource } from '../../../shared/domain/food';
import { FoodAttribution } from '../../../shared/food/food-attribution';
import { NutrientPipe } from '../../../shared/food/nutrient.pipe';
import { SourceBadge } from '../../../shared/food/source-badge';
import { Button } from '../../../shared/ui/button/button';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { debounced } from '../../../shared/util/debounced';
import { AdminApi, adminFoodsResource } from '../admin-api';
import { AccountBadge } from '../ui/account-badge';

const PAGE_SIZE = 20;

/** Moderação da base: busca incluindo os desativados, desativar e reativar. */
@Component({
  selector: 'app-admin-foods',
  imports: [
    AccountBadge,
    Button,
    ConfirmDialog,
    FoodAttribution,
    LoadError,
    LucideSearch,
    NutrientPipe,
    PageHeader,
    Pagination,
    SourceBadge,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './admin-foods.html',
})
export class AdminFoodsPage {
  private readonly api = inject(AdminApi);
  private readonly toaster = inject(Toaster);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly minLength = FOOD_SEARCH_MIN;
  protected readonly sources: readonly { value: FoodSource | null; label: string }[] = [
    { value: null, label: 'Todas as fontes' },
    { value: 'Taco', label: FOOD_SOURCE_LABELS.Taco },
    { value: 'OpenFoodFacts', label: FOOD_SOURCE_LABELS.OpenFoodFacts },
  ];

  protected readonly search = signal('');
  private readonly debouncedSearch = debounced(this.search);
  protected readonly source = signal<FoodSource | null>(null);
  protected readonly page = linkedSignal({
    source: () => [this.debouncedSearch(), this.source()],
    computation: () => 1,
  });
  protected readonly foods = adminFoodsResource(
    this.debouncedSearch,
    this.source,
    this.page,
    PAGE_SIZE,
  );
  protected readonly tooShort = computed(
    () => this.debouncedSearch().trim().length < FOOD_SEARCH_MIN,
  );
  protected readonly attributions = computed(() =>
    this.foods.hasValue() ? this.foods.value().items.map((food) => food.attribution) : [],
  );

  protected readonly target = signal<Food | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected ask(food: Food): void {
    this.error.set(null);
    this.target.set(food);
  }

  protected close(): void {
    if (!this.busy()) {
      this.target.set(null);
    }
  }

  protected async confirm(): Promise<void> {
    const food = this.target();
    if (!food || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(
        food.isActive ? this.api.deactivateFood(food.id) : this.api.activateFood(food.id),
      );
      this.target.set(null);
      this.toaster.show(food.isActive ? 'Alimento desativado.' : 'Alimento reativado.');
      this.foods.reload();
    } catch (error) {
      this.error.set(errorSummary(error));
    } finally {
      this.busy.set(false);
    }
  }
}

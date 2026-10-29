import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideInfo,
  LucideScanBarcode,
  LucideSearch,
  LucideX,
} from '@lucide/angular';
import { FOOD_SOURCE_LABELS, FoodSource } from '../../../shared/domain/food';
import { FoodAttribution } from '../../../shared/food/food-attribution';
import { NutrientPipe } from '../../../shared/food/nutrient.pipe';
import { SourceBadge } from '../../../shared/food/source-badge';
import { Button } from '../../../shared/ui/button/button';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { debounced } from '../../../shared/util/debounced';
import { FOOD_SEARCH_MIN, foodsResource } from './foods-api';

const PAGE_SIZE = 15;

@Component({
  selector: 'app-food-search',
  imports: [
    Button,
    FoodAttribution,
    LoadError,
    LucideChevronLeft,
    LucideChevronRight,
    LucideInfo,
    LucideScanBarcode,
    LucideSearch,
    LucideX,
    NutrientPipe,
    PageHeader,
    RouterLink,
    SourceBadge,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './food-search.html',
})
export class FoodSearchPage {
  private readonly router = inject(Router);
  private readonly query = inject(ActivatedRoute).snapshot.queryParamMap;

  protected readonly minLength = FOOD_SEARCH_MIN;
  protected readonly sources: readonly { value: FoodSource | null; label: string }[] = [
    { value: null, label: 'Todas as fontes' },
    { value: 'Taco', label: FOOD_SOURCE_LABELS.Taco },
    { value: 'OpenFoodFacts', label: FOOD_SOURCE_LABELS.OpenFoodFacts },
  ];

  /** Estado na URL: voltar do detalhe mantém a busca, e o link pode ser compartilhado. */
  protected readonly searchInput = signal(this.query.get('busca') ?? '');
  private readonly search = debounced(this.searchInput);
  protected readonly source = signal<FoodSource | null>(parseSource(this.query.get('fonte')));
  protected readonly page = signal(Math.max(1, Number(this.query.get('pagina')) || 1));

  protected readonly foods = foodsResource(this.search, this.source, this.page, PAGE_SIZE);
  protected readonly tooShort = computed(() => this.search().trim().length < FOOD_SEARCH_MIN);
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil((this.foods.value()?.totalItems ?? 0) / PAGE_SIZE)),
  );
  protected readonly attributions = computed(() =>
    this.foods.hasValue() ? this.foods.value().items.map((food) => food.attribution) : [],
  );

  constructor() {
    effect(() => {
      const busca = this.search().trim() || null;
      const fonte = this.source();
      const pagina = this.page() > 1 ? this.page() : null;
      void this.router.navigate([], {
        queryParams: { busca, fonte, pagina },
        replaceUrl: true,
      });
    });
  }

  protected onSearch(event: Event): void {
    this.searchInput.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected clearSearch(): void {
    this.searchInput.set('');
    this.page.set(1);
  }

  protected selectSource(source: FoodSource | null): void {
    this.source.set(source);
    this.page.set(1);
  }

  protected goToPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.totalPages()));
  }
}

function parseSource(value: string | null): FoodSource | null {
  return value === 'Taco' || value === 'OpenFoodFacts' ? value : null;
}

import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormField, FormRoot, form, min, required } from '@angular/forms/signals';
import { LucideArrowLeft, LucidePlus, LucideSearch } from '@lucide/angular';
import { FOOD_SOURCE_LABELS, FoodSource, NutrientsPer100g } from '../../../shared/domain/food';
import { MealFood } from '../../../shared/domain/nutrition-plan';
import { FoodAttribution } from '../../../shared/food/food-attribution';
import { NutrientPipe } from '../../../shared/food/nutrient.pipe';
import { SourceBadge } from '../../../shared/food/source-badge';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { FieldInput } from '../../../shared/ui/field/field-input';
import { Modal } from '../../../shared/ui/modal/modal';
import { debounced } from '../../../shared/util/debounced';
import { FOOD_SEARCH_MIN, foodsResource } from '../foods/foods-api';

/** O que o modal precisa de um alimento: o da busca (Food) ou o que já está na refeição (MealFood). */
export interface PickedFood extends NutrientsPer100g {
  id: string;
  name: string;
  brand: string | null;
  source: FoodSource;
  attribution: string | null;
  isComplete?: boolean;
}

export interface FoodPortion {
  foodId: string;
  quantityInGrams: number;
}

const RESULTS = 8;

/**
 * Adicionar alimento à refeição (busca → quantidade) ou, com `current`, só mudar a quantidade.
 * A prévia da porção é uma estimativa na tela; os totais oficiais vêm da API ao recarregar o plano.
 */
@Component({
  selector: 'app-food-picker-modal',
  imports: [
    Alert,
    Button,
    Field,
    FieldInput,
    FoodAttribution,
    FormField,
    FormRoot,
    LucideArrowLeft,
    LucidePlus,
    LucideSearch,
    Modal,
    NutrientPipe,
    SourceBadge,
  ],
  templateUrl: './food-picker-modal.html',
})
export class FoodPickerModal {
  readonly mealName = input.required<string>();
  /** Alimento já na refeição: o modal abre direto na quantidade. */
  readonly current = input<MealFood | null>(null);
  readonly busy = input(false, { transform: booleanAttribute });
  readonly error = input<string | null>(null);
  readonly saved = output<FoodPortion>();
  readonly closed = output();

  protected readonly minLength = FOOD_SEARCH_MIN;
  protected readonly sources: readonly { value: FoodSource | null; label: string }[] = [
    { value: null, label: 'Todas' },
    { value: 'Taco', label: FOOD_SOURCE_LABELS.Taco },
    { value: 'OpenFoodFacts', label: FOOD_SOURCE_LABELS.OpenFoodFacts },
  ];

  protected readonly searchInput = signal('');
  private readonly search = debounced(this.searchInput);
  protected readonly source = signal<FoodSource | null>(null);
  protected readonly foods = foodsResource(this.search, this.source, signal(1), RESULTS);
  protected readonly tooShort = computed(() => this.search().trim().length < FOOD_SEARCH_MIN);

  /** Alimento escolhido. Editando, já começa com o da refeição. */
  protected readonly selected = linkedSignal<PickedFood | null>(() => {
    const current = this.current();
    return current ? { ...current, id: current.foodId } : null;
  });
  protected readonly model = linkedSignal<{ quantityInGrams: number | null }>(() => ({
    quantityInGrams: this.current()?.quantityInGrams ?? 100,
  }));
  protected readonly portionForm = form(
    this.model,
    (path) => {
      required(path.quantityInGrams, { message: 'Informe a quantidade.' });
      min(path.quantityInGrams, 0.1, { message: 'A quantidade deve ser maior que zero.' });
    },
    { name: 'portion', submission: { action: async () => this.submit() } },
  );

  /** Estimativa da porção para a pessoa conferir antes de salvar. */
  protected readonly preview = computed(() => {
    const food = this.selected();
    const grams = this.model().quantityInGrams;
    if (!food || !grams || grams <= 0) {
      return null;
    }
    const scale = (value: number | null) => (value === null ? null : (value * grams) / 100);
    return {
      energy: scale(food.energyKcalPer100g),
      protein: scale(food.proteinPer100g),
      carbohydrate: scale(food.carbohydratePer100g),
      fat: scale(food.fatPer100g),
    };
  });

  private readonly injector = inject(Injector);
  private readonly searchField = viewChild<ElementRef<HTMLInputElement>>('busca');
  private readonly quantityField = viewChild<ElementRef<HTMLInputElement>>('quantidade');

  protected onSearch(event: Event): void {
    this.searchInput.set((event.target as HTMLInputElement).value);
  }

  /** O botão clicado sai da tela: o foco vai para a quantidade (e volta para a busca ao trocar). */
  protected choose(food: PickedFood): void {
    this.selected.set(food);
    afterNextRender(() => this.quantityField()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  protected backToSearch(): void {
    this.selected.set(null);
    afterNextRender(() => this.searchField()?.nativeElement.focus(), { injector: this.injector });
  }

  private submit(): undefined {
    const food = this.selected();
    const grams = this.model().quantityInGrams;
    if (food && grams) {
      this.saved.emit({ foodId: food.id, quantityInGrams: grams });
    }
    return undefined;
  }
}

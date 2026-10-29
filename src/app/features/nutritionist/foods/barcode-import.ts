import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideCircleCheck,
  LucideDownload,
  LucideInfo,
  LucideScanBarcode,
  LucideSearch,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { ApiError, toApiError } from '../../../core/http/api-error';
import { NUTRIENTS, ProductPreview } from '../../../shared/domain/food';
import { FoodAttribution } from '../../../shared/food/food-attribution';
import { MacroSplit } from '../../../shared/food/macro-split';
import { NutrientPipe } from '../../../shared/food/nutrient.pipe';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { FoodsApi } from './foods-api';

/** Tamanhos aceitos pela API: EAN-8, UPC-A (12), EAN-13 e GTIN-14. */
const VALID_LENGTHS = [8, 12, 13, 14];

/** Mensagens mais úteis que as genéricas para os erros que a API documenta neste fluxo. */
const BARCODE_ERRORS: Partial<Record<number, string>> = {
  404: 'Produto não encontrado na base nem no Open Food Facts. Confira o código ou use um alimento da TACO.',
  429: 'Muitas consultas seguidas (limite de 10 por minuto). Espere um minuto e tente de novo.',
  503: 'O catálogo do Open Food Facts está fora do ar no momento. Tente de novo em instantes.',
};

@Component({
  selector: 'app-barcode-import',
  imports: [
    Alert,
    Button,
    FoodAttribution,
    LucideArrowLeft,
    LucideCircleCheck,
    LucideDownload,
    LucideInfo,
    LucideScanBarcode,
    LucideSearch,
    MacroSplit,
    NutrientPipe,
    PageHeader,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './barcode-import.html',
})
export class BarcodeImportPage {
  private readonly api = inject(FoodsApi);
  private readonly router = inject(Router);
  private readonly toaster = inject(Toaster);

  protected readonly nutrients = NUTRIENTS;
  /** Só dígitos: leitores de código de barras às vezes mandam espaços ou hífens. */
  protected readonly code = signal('');
  protected readonly touched = signal(false);
  protected readonly validCode = computed(() => VALID_LENGTHS.includes(this.code().length));

  protected readonly searching = signal(false);
  protected readonly importing = signal(false);
  protected readonly preview = signal<ProductPreview | null>(null);
  protected readonly failure = signal<ApiError | null>(null);

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 14);
    input.value = digits;
    this.code.set(digits);
  }

  protected async search(): Promise<void> {
    this.touched.set(true);
    if (!this.validCode() || this.searching()) {
      return;
    }
    this.searching.set(true);
    this.failure.set(null);
    this.preview.set(null);
    try {
      this.preview.set(await firstValueFrom(this.api.barcodePreview(this.code())));
    } catch (error) {
      this.failure.set(withFriendlyMessage(toApiError(error)));
    } finally {
      this.searching.set(false);
    }
  }

  protected async import(): Promise<void> {
    const preview = this.preview();
    if (!preview || this.importing()) {
      return;
    }
    this.importing.set(true);
    this.failure.set(null);
    try {
      const response = await firstValueFrom(this.api.importBarcode(preview.barcode));
      const food = response.body;
      if (response.status === 200 && food && !food.isActive) {
        this.toaster.show('Este produto já estava na base, mas está desativado.', 'info');
      } else {
        this.toaster.show(
          response.status === 201
            ? 'Produto importado para a base.'
            : 'Este produto já estava na base.',
        );
      }
      if (food) {
        await this.router.navigate(['/nutricionista/alimentos', food.id]);
      }
    } catch (error) {
      // 422: o Open Food Facts tem valores impossíveis para este produto; a API recusa a importação.
      this.failure.set(withFriendlyMessage(toApiError(error)));
    } finally {
      this.importing.set(false);
    }
  }

  protected discard(): void {
    this.preview.set(null);
    this.failure.set(null);
  }
}

/** 404, 429 e 503 ganham a mensagem do fluxo; o resto (ex.: 422) mantém a mensagem da API. */
function withFriendlyMessage(error: ApiError): ApiError {
  const friendly = BARCODE_ERRORS[error.status];
  return friendly ? { ...error, message: friendly } : error;
}

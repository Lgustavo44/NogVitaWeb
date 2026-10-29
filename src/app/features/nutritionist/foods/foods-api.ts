import { HttpClient, HttpResponse, httpResource } from '@angular/common/http';
import { Service, Signal, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { apiUrl } from '../../../core/http/api-url';
import {
  FOOD_SEARCH_MIN,
  Food,
  FoodSource,
  ProductPreview,
  normalizeNutrients,
} from '../../../shared/domain/food';
import { PagedResponse } from '../../../shared/domain/paged-response';

export { FOOD_SEARCH_MIN };

/** Leitura e importação por código de barras (prévia e importação dividem 10 chamadas por minuto). */
@Service()
export class FoodsApi {
  private readonly http = inject(HttpClient);

  /** Procura na base; se não achar, no Open Food Facts. 404: não encontrado. 503: Open Food Facts fora do ar. */
  barcodePreview(barcode: string): Observable<ProductPreview> {
    return this.http
      .get<ProductPreview>(apiUrl(`/foods/barcode/${barcode}`))
      .pipe(map((preview) => normalizeNutrients(preview)));
  }

  /** 201: importado. 200: já estava na base (inclusive desativado). 422: dados nutricionais impossíveis. */
  importBarcode(barcode: string): Observable<HttpResponse<Food>> {
    return this.http.post<Food>(
      apiUrl(`/foods/barcode/${barcode}/import`),
      {},
      { observe: 'response' },
    );
  }
}

/** Busca por palavras do nome (sem acento, em qualquer ordem). Só busca a partir de 2 caracteres. */
export function foodsResource(
  search: Signal<string>,
  source: Signal<FoodSource | null>,
  page: Signal<number>,
  pageSize: number,
) {
  return httpResource(
    () => {
      const term = search().trim();
      if (term.length < FOOD_SEARCH_MIN) {
        return undefined;
      }
      const sourceFilter = source();
      return {
        url: apiUrl('/foods'),
        params: {
          search: term,
          page: page(),
          pageSize,
          ...(sourceFilter ? { source: sourceFilter } : {}),
        },
      };
    },
    {
      parse: (raw) => {
        const response = raw as PagedResponse<Food>;
        return { ...response, items: response.items.map((food) => normalizeNutrients(food)) };
      },
    },
  );
}

export function foodResource(id: Signal<string | null>) {
  return httpResource(
    () => {
      const foodId = id();
      return foodId ? apiUrl(`/foods/${foodId}`) : undefined;
    },
    { parse: (raw) => normalizeNutrients(raw as Food) },
  );
}

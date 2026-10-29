import { Injectable } from '@angular/core';
import { nutritionistProfileResource } from './nutritionist-api';

/** O perfil do nutricionista, carregado uma vez pela área e compartilhado com as telas dela. */
@Injectable()
export class NutritionistProfileStore {
  readonly profile = nutritionistProfileResource();
}

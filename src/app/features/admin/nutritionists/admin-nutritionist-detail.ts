import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * `/admin/nutricionistas/:id` abre o detalhe da conta (`/admin/usuarios/:id`), onde ficam
 * também o reenvio do convite e o cancelamento do pré-cadastro.
 */
@Component({ selector: 'app-admin-nutritionist-detail', template: '' })
export class AdminNutritionistDetailPage {
  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id');
    void inject(Router).navigate(['/admin/usuarios', id], { replaceUrl: true });
  }
}

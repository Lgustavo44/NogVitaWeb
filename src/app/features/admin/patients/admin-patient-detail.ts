import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * `/admin/pacientes/:id` abre o detalhe da conta: a API devolve o mesmo formato para
 * usuário, paciente e nutricionista, então há uma tela só (`/admin/usuarios/:id`).
 */
@Component({ selector: 'app-admin-patient-detail', template: '' })
export class AdminPatientDetailPage {
  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id');
    void inject(Router).navigate(['/admin/usuarios', id], { replaceUrl: true });
  }
}

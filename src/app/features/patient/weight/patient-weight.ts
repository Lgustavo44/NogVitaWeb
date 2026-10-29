import { Component } from '@angular/core';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { WeightPanel } from '../../../shared/weight/weight-panel';

@Component({
  selector: 'app-patient-weight',
  imports: [PageHeader, WeightPanel],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <app-page-header
      badge="Evolução"
      title="Meu peso"
      subtitle="Registre seu peso e acompanhe a evolução. Seu nutricionista também vê estes registros."
    />
    <app-weight-panel
      recordsPath="/patients/me/weight-records"
      deletePath="/patients/me/weight-records"
      perspective="patient"
    />
  `,
})
export class PatientWeightPage {}

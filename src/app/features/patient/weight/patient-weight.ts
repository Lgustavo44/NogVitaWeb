import { Component } from '@angular/core';
import { ProgressPhotosPanel } from '../../../shared/progress-photos/progress-photos-panel';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { WeightPanel } from '../../../shared/weight/weight-panel';

@Component({
  selector: 'app-patient-weight',
  imports: [PageHeader, ProgressPhotosPanel, WeightPanel],
  host: { class: 'flex flex-col gap-10' },
  template: `
    <app-page-header
      title="Peso e evolução"
      subtitle="Registre seu peso e suas fotos para acompanhar a evolução. Seu nutricionista também vê."
    />
    <app-weight-panel
      recordsPath="/patients/me/weight-records"
      deletePath="/patients/me/weight-records"
      perspective="patient"
    />
    <app-progress-photos-panel
      photosPath="/patients/me/progress-photos"
      perspective="patient"
      weightRecordsPath="/patients/me/weight-records"
    />
  `,
})
export class PatientWeightPage {}

import { Injectable } from '@angular/core';
import { patientProfileResource } from './patient-api';

/**
 * O perfil do paciente, carregado uma vez pela área e compartilhado com as telas dela.
 * É fornecido pelo PatientArea (não é global): some ao sair da área, sem vazar para outra conta.
 */
@Injectable()
export class PatientProfileStore {
  readonly profile = patientProfileResource();
}

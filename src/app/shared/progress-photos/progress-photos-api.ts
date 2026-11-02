import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../core/http/api-url';
import { ProgressPhoto, UploadProgressPhoto } from './progress-photos.models';

const PATIENT = '/patients/me/progress-photos';

/** Escritas das fotos de evolução: só o paciente envia, apaga e decide sobre o termo. */
@Service()
export class ProgressPhotosApi {
  private readonly http = inject(HttpClient);

  /** Aceita a versão vigente do termo (422 se a versão mudou no meio do caminho). */
  acceptConsent(version: string): Observable<void> {
    return this.http.post<void>(apiUrl(`${PATIENT}/consent`), { version });
  }

  /** Revoga o termo: a API apaga todas as fotos de evolução. */
  revokeConsent(): Observable<void> {
    return this.http.delete<void>(apiUrl(`${PATIENT}/consent`));
  }

  /** Mesma data e ângulo de uma foto existente: a API substitui (o id continua o mesmo). */
  upload({ file, takenOn, angle }: UploadProgressPhoto): Observable<ProgressPhoto> {
    const body = new FormData();
    body.append('file', file);
    body.append('takenOn', takenOn);
    body.append('angle', angle);
    return this.http.post<ProgressPhoto>(apiUrl(PATIENT), body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(apiUrl(`${PATIENT}/${id}`));
  }
}

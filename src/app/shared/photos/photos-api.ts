import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../core/http/api-url';

/**
 * Fotos de perfil (paciente e nutricionista). O `path` é a rota da área, ex.: '/patients/me/photo'.
 * Multipart sem Content-Type explícito: o navegador monta o boundary. O token vem do interceptor.
 */
@Service()
export class PhotosApi {
  private readonly http = inject(HttpClient);

  /** Envia ou troca a foto; a API devolve a URL nova (WebP de até 512 px). */
  uploadProfilePhoto(path: string, file: File): Observable<{ photoUrl: string }> {
    const body = new FormData();
    body.append('file', file);
    return this.http.put<{ photoUrl: string }>(apiUrl(path), body);
  }

  /** Remove a foto (204 mesmo se não houver). */
  deleteProfilePhoto(path: string): Observable<void> {
    return this.http.delete<void>(apiUrl(path));
  }
}

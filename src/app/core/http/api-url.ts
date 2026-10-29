import { environment } from '../../../environments/environment';

/** Monta a URL de um endpoint da API v1. Ex.: `apiUrl('/auth/login')`. */
export function apiUrl(path: string): string {
  return `${environment.apiBaseUrl}/api/v1${path}`;
}

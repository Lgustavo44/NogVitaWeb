import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../core/http/api-url';

/**
 * Termo dos dados de saúde (LGPD, art. 11, I) e da transferência internacional (art. 33, VIII).
 * São dois aceites separados: a lei pede que a transferência fique "distinguida claramente" das outras finalidades.
 */
export interface HealthDataConsentTerm {
  version: string;
  healthDataText: string;
  internationalTransferText: string;
}

export interface HealthDataConsentStatus extends HealthDataConsentTerm {
  accepted: boolean;
  acceptedAtUtc: string | null;
}

/** Público: o texto atual, para a tela de cadastro. */
export const HEALTH_DATA_CONSENT_TERM_URL = '/patients/health-data-consent';
/** Do paciente conectado: `accepted: false` para quem se cadastrou antes do termo ou de uma versão nova. */
export const MY_HEALTH_DATA_CONSENT_URL = '/patients/me/health-data-consent';

@Service()
export class HealthDataConsentApi {
  private readonly http = inject(HttpClient);

  /** 422 se a versão mudou enquanto a tela estava aberta: recarregue o termo. */
  accept(version: string): Observable<void> {
    return this.http.post<void>(apiUrl(MY_HEALTH_DATA_CONSENT_URL), {
      version,
      acceptHealthData: true,
      acceptInternationalTransfer: true,
    });
  }
}

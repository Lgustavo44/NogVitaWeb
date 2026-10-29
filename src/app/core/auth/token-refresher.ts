import { HttpErrorResponse } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { Auth } from './auth';
import { AuthApi } from './auth-api';
import { Session } from './session';

/**
 * Renova o access token com uma requisição por vez (single-flight).
 * A API encerra todas as sessões se o mesmo refresh token for usado duas vezes,
 * então quem pedir enquanto uma renovação está em andamento espera por ela.
 */
@Service()
export class TokenRefresher {
  private readonly auth = inject(Auth);
  private readonly authApi = inject(AuthApi);
  private readonly session = inject(Session);
  private inFlight: Observable<string> | null = null;

  /** O access token atual; renova antes se ele estiver para vencer. */
  validAccessToken(): Observable<string | null> {
    const token = this.session.accessToken();
    if (!token) {
      return of(null);
    }
    return this.session.accessTokenExpiresSoon() ? this.refresh() : of(token);
  }

  refresh(): Observable<string> {
    if (this.inFlight) {
      return this.inFlight;
    }
    const refreshToken = this.session.refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Sem sessão para renovar.'));
    }

    this.inFlight = this.authApi.refresh(refreshToken).pipe(
      tap((tokens) => this.session.store(tokens)),
      map((tokens) => tokens.accessToken),
      catchError((error: unknown) => {
        // Só a recusa da API encerra a sessão. Falta de rede ou 5xx: tenta de novo na próxima chamada.
        if (error instanceof HttpErrorResponse && (error.status === 400 || error.status === 401)) {
          void this.auth.expire();
        }
        return throwError(() => error);
      }),
      finalize(() => (this.inFlight = null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.inFlight;
  }
}

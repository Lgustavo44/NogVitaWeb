import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../http/api-url';
import { AuthResponse, LoginRequest, MessageResponse } from './auth.models';

@Service()
export class AuthApi {
  private readonly http = inject(HttpClient);

  /** 401: e-mail ou senha inválidos (mensagem sempre igual). 403: e-mail não confirmado. */
  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(apiUrl('/auth/login'), body);
  }

  /** Responde sempre 202, exista ou não um cadastro pendente com esse e-mail. */
  resendEmailConfirmation(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(apiUrl('/auth/email-confirmation/resend'), { email });
  }

  /** Idempotente: 204 mesmo se o token já não valer. */
  logout(refreshToken: string): Observable<void> {
    return this.http.post<void>(apiUrl('/auth/logout'), { refreshToken });
  }
}

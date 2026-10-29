import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../http/api-url';
import {
  AuthResponse,
  InvitationAcceptRequest,
  LoginRequest,
  MeResponse,
  MessageResponse,
  PasswordResetConfirmRequest,
  PatientRegistrationRequest,
} from './auth.models';

/** Só os endpoints de `/auth`. Os de cada área ficam na pasta da própria área. */
@Service()
export class AuthApi {
  private readonly http = inject(HttpClient);

  /** 401: e-mail ou senha inválidos (mensagem sempre igual). 403: e-mail não confirmado. */
  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(apiUrl('/auth/login'), body);
  }

  /** Devolve um par novo. Reusar um refresh token já trocado encerra todas as sessões do usuário. */
  refresh(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(apiUrl('/auth/refresh'), { refreshToken });
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(apiUrl('/auth/me'));
  }

  /** Idempotente: 204 mesmo se o token já não valer. */
  logout(refreshToken: string): Observable<void> {
    return this.http.post<void>(apiUrl('/auth/logout'), { refreshToken });
  }

  /** Responde sempre 202 com a mesma mensagem, mesmo se o e-mail ou o CPF já existirem. */
  registerPatient(body: PatientRegistrationRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(apiUrl('/auth/register/patient'), body);
  }

  confirmEmail(token: string): Observable<void> {
    return this.http.post<void>(apiUrl('/auth/email-confirmation/confirm'), { token });
  }

  /** Responde sempre 202, exista ou não um cadastro pendente com esse e-mail. */
  resendEmailConfirmation(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(apiUrl('/auth/email-confirmation/resend'), { email });
  }

  requestPasswordReset(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(apiUrl('/auth/password-reset/request'), { email });
  }

  confirmPasswordReset(body: PasswordResetConfirmRequest): Observable<void> {
    return this.http.post<void>(apiUrl('/auth/password-reset/confirm'), body);
  }

  acceptNutritionistInvitation(body: InvitationAcceptRequest): Observable<void> {
    return this.http.post<void>(apiUrl('/auth/invitations/accept'), body);
  }
}

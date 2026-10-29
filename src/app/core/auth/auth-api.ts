import { HttpClient, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../http/api-url';
import {
  AuthResponse,
  AdminUserSummary,
  InvitationAcceptRequest,
  LoginRequest,
  MeResponse,
  MessageResponse,
  PasswordResetConfirmRequest,
  PatientProfile,
  PatientRegistrationRequest,
  NutritionistPatientSummary,
  NutritionistProfile,
  PagedResponse,
} from './auth.models';

@Service()
export class AuthApi {
  private readonly http = inject(HttpClient);

  /** 401: e-mail ou senha inválidos (mensagem sempre igual). 403: e-mail não confirmado. */
  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(apiUrl('/auth/login'), body);
  }

  getCurrentUser(): Observable<MeResponse> {
    return this.http.get<MeResponse>(apiUrl('/auth/me'));
  }

  getAdminUsers(): Observable<PagedResponse<AdminUserSummary>> {
    const params = new HttpParams().set('page', 1).set('pageSize', 10);
    return this.http.get<PagedResponse<AdminUserSummary>>(apiUrl('/admin/users'), { params });
  }

  getNutritionistProfile(): Observable<NutritionistProfile> {
    return this.http.get<NutritionistProfile>(apiUrl('/nutritionists/me'));
  }

  getNutritionistPatients(): Observable<PagedResponse<NutritionistPatientSummary>> {
    const params = new HttpParams().set('page', 1).set('pageSize', 10);
    return this.http.get<PagedResponse<NutritionistPatientSummary>>(
      apiUrl('/nutritionists/me/patients'),
      { params },
    );
  }

  registerPatient(body: PatientRegistrationRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(apiUrl('/auth/register/patient'), body);
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

  confirmEmail(token: string): Observable<void> {
    return this.http.post<void>(apiUrl('/auth/email-confirmation/confirm'), { token });
  }

  getPatientProfile(): Observable<PatientProfile> {
    return this.http.get<PatientProfile>(apiUrl('/patients/me'));
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

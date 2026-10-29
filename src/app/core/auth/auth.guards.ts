import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from './auth.models';
import { CurrentUser } from './current-user';
import { Session } from './session';

/** Só deixa entrar com sessão; sem ela, manda para o login. */
export const requireSession: CanActivateFn = () =>
  inject(Session).isAuthenticated() || inject(Router).parseUrl('/login');

/** Telas públicas (login, cadastro): quem já entrou vai direto para o início. */
export const redirectIfAuthenticated: CanActivateFn = () =>
  !inject(Session).isAuthenticated() || inject(Router).parseUrl('/inicio');

/**
 * Só deixa entrar na área de quem tem o papel. Espera o `GET /auth/me`
 * (no cold start, a barra de progresso e o aviso de servidor acordando aparecem enquanto isso).
 */
export function requireRole(role: Role): CanActivateFn {
  return async () => {
    const router = inject(Router);
    const currentUser = inject(CurrentUser);
    const session = inject(Session);

    try {
      await currentUser.load();
    } catch {
      // Refresh recusado: o Auth já encerrou a sessão e está indo para "sessão expirada".
      // Senão, a API não respondeu (rede ou erro 5xx).
      return session.isAuthenticated() ? router.parseUrl('/indisponivel') : false;
    }
    return currentUser.hasRole(role) || router.parseUrl('/sem-permissao');
  };
}

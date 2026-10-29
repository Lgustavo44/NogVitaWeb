import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session } from './session';

/** Só deixa entrar com sessão; sem ela, manda para o login. */
export const requireSession: CanActivateFn = () =>
  inject(Session).isAuthenticated() || inject(Router).parseUrl('/login');

/** Telas públicas (login, cadastro): quem já entrou vai direto para o início. */
export const redirectIfAuthenticated: CanActivateFn = () =>
  !inject(Session).isAuthenticated() || inject(Router).parseUrl('/inicio');

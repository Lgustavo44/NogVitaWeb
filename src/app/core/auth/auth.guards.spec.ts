import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { requireRole } from './auth.guards';
import { Session } from './session';

describe('requireRole', () => {
  let controller: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
    TestBed.inject(Session).store({
      accessToken: 'a',
      accessTokenExpiresAtUtc: new Date(Date.now() + 900_000).toISOString(),
      refreshToken: 'r',
      refreshTokenExpiresAtUtc: new Date(Date.now() + 86_400_000).toISOString(),
    });
  });

  function run(role: 'Patient' | 'Admin') {
    return runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
      requireRole(role)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Promise<boolean | UrlTree>;
  }

  it('deixa entrar quem tem o papel', async () => {
    const result = run('Patient');
    controller.expectOne('/api/v1/auth/me').flush({ userId: 'u1', roles: ['Patient'] });

    expect(await result).toBe(true);
  });

  it('manda para "sem permissão" quem não tem o papel', async () => {
    const result = run('Admin');
    controller.expectOne('/api/v1/auth/me').flush({ userId: 'u1', roles: ['Patient'] });

    expect(String(await result)).toBe('/sem-permissao');
  });

  it('manda para "indisponível" quando a API não responde', async () => {
    const result = run('Patient');
    controller.expectOne('/api/v1/auth/me').flush(null, { status: 503, statusText: 'Unavailable' });

    expect(String(await result)).toBe('/indisponivel');
  });

  it('chama o /auth/me uma vez só, mesmo com dois guards ao mesmo tempo', async () => {
    const first = run('Patient');
    const second = run('Patient');
    controller.expectOne('/api/v1/auth/me').flush({ userId: 'u1', roles: ['Patient'] });

    expect(await first).toBe(true);
    expect(await second).toBe(true);
  });
});

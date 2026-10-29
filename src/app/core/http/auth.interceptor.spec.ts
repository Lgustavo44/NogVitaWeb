import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthResponse } from '../auth/auth.models';
import { Session } from '../auth/session';
import { authInterceptor } from './auth.interceptor';

const ME = '/api/v1/auth/me';
const REFRESH = '/api/v1/auth/refresh';

function tokens(access: string, refresh: string, minutesToExpire = 15): AuthResponse {
  return {
    accessToken: access,
    accessTokenExpiresAtUtc: new Date(Date.now() + minutesToExpire * 60_000).toISOString(),
    refreshToken: refresh,
    refreshTokenExpiresAtUtc: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  };
}

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let session: Session;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    session = TestBed.inject(Session);
  });

  afterEach(() => controller.verify());

  it('coloca o Bearer nas chamadas à API', () => {
    session.store(tokens('acesso-1', 'refresh-1'));

    http.get(ME).subscribe();

    expect(controller.expectOne(ME).request.headers.get('Authorization')).toBe('Bearer acesso-1');
  });

  it('não coloca o Bearer no login nem em outros domínios', () => {
    session.store(tokens('acesso-1', 'refresh-1'));

    http.post('/api/v1/auth/login', {}).subscribe();
    http.get('https://outro-site.com/dados').subscribe();

    expect(controller.expectOne('/api/v1/auth/login').request.headers.has('Authorization')).toBe(
      false,
    );
    expect(
      controller.expectOne('https://outro-site.com/dados').request.headers.has('Authorization'),
    ).toBe(false);
  });

  it('no 401, renova uma vez só para várias requisições e repete cada uma com o token novo', () => {
    session.store(tokens('acesso-velho', 'refresh-1'));
    const results: unknown[] = [];

    http.get(ME).subscribe((body) => results.push(body));
    http.get('/api/v1/patients/me').subscribe((body) => results.push(body));
    controller.expectOne(ME).flush(null, { status: 401, statusText: 'Unauthorized' });
    controller
      .expectOne('/api/v1/patients/me')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    const refresh = controller.expectOne(REFRESH);
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-1' });
    refresh.flush(tokens('acesso-novo', 'refresh-2'));

    const retriedMe = controller.expectOne(ME);
    const retriedProfile = controller.expectOne('/api/v1/patients/me');
    expect(retriedMe.request.headers.get('Authorization')).toBe('Bearer acesso-novo');
    expect(retriedProfile.request.headers.get('Authorization')).toBe('Bearer acesso-novo');
    retriedMe.flush({ ok: 1 });
    retriedProfile.flush({ ok: 2 });

    expect(results).toEqual([{ ok: 1 }, { ok: 2 }]);
    expect(session.refreshToken()).toBe('refresh-2');
  });

  it('renova antes de chamar quando o token está para vencer', () => {
    session.store(tokens('acesso-velho', 'refresh-1', 0));

    http.get(ME).subscribe();

    controller.expectOne(REFRESH).flush(tokens('acesso-novo', 'refresh-2'));
    expect(controller.expectOne(ME).request.headers.get('Authorization')).toBe(
      'Bearer acesso-novo',
    );
  });

  it('se a API recusar o refresh, encerra a sessão e vai para "sessão expirada"', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    session.store(tokens('acesso-velho', 'refresh-1'));
    let failed = false;

    http.get(ME).subscribe({ error: () => (failed = true) });
    controller.expectOne(ME).flush(null, { status: 401, statusText: 'Unauthorized' });
    controller
      .expectOne(REFRESH)
      .flush(
        { title: 'Sessão inválida ou expirada.' },
        { status: 401, statusText: 'Unauthorized' },
      );

    expect(failed).toBe(true);
    expect(session.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/sessao-expirada');
  });

  it('não repete em loop: se a requisição repetida também der 401, devolve o erro', () => {
    session.store(tokens('acesso-velho', 'refresh-1'));
    let status = 0;

    http.get(ME).subscribe({ error: (error) => (status = error.status) });
    controller.expectOne(ME).flush(null, { status: 401, statusText: 'Unauthorized' });
    controller.expectOne(REFRESH).flush(tokens('acesso-novo', 'refresh-2'));
    controller.expectOne(ME).flush(null, { status: 401, statusText: 'Unauthorized' });

    controller.expectNone(REFRESH);
    expect(status).toBe(401);
  });
});

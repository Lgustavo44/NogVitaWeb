import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  RATE_LIMIT_BASE_DELAY_MS,
  RATE_LIMIT_MAX_DELAY_MS,
  rateLimitRetryInterceptor,
} from './rate-limit-retry';

describe('rateLimitRetryInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  const tooMany = { status: 429, statusText: 'Too Many Requests' };

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([rateLimitRetryInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    vi.useRealTimers();
  });

  it('repete o GET depois de um 429 e entrega a resposta', () => {
    let body: unknown;
    http.get('/api/v1/auth/me').subscribe((value) => (body = value));

    controller.expectOne('/api/v1/auth/me').flush(null, tooMany);
    vi.advanceTimersByTime(RATE_LIMIT_BASE_DELAY_MS);
    controller.expectOne('/api/v1/auth/me').flush({ userId: 'u1' });

    expect(body).toEqual({ userId: 'u1' });
  });

  it('respeita o Retry-After, com teto', () => {
    http.get('/api/v1/x').subscribe({ error: () => undefined });
    controller.expectOne('/api/v1/x').flush(null, { ...tooMany, headers: { 'Retry-After': '60' } });

    vi.advanceTimersByTime(RATE_LIMIT_MAX_DELAY_MS - 1);
    controller.expectNone('/api/v1/x');
    vi.advanceTimersByTime(1);
    controller.expectOne('/api/v1/x').flush({});
  });

  it('desiste depois de duas novas tentativas', () => {
    let status = 0;
    http.get('/api/v1/x').subscribe({ error: (error) => (status = error.status) });

    controller.expectOne('/api/v1/x').flush(null, tooMany);
    vi.advanceTimersByTime(RATE_LIMIT_BASE_DELAY_MS);
    controller.expectOne('/api/v1/x').flush(null, tooMany);
    vi.advanceTimersByTime(RATE_LIMIT_BASE_DELAY_MS * 2);
    controller.expectOne('/api/v1/x').flush(null, tooMany);

    expect(status).toBe(429);
  });

  it('não repete outros erros nem métodos que mudam dados', () => {
    let getStatus = 0;
    let postStatus = 0;
    http.get('/api/v1/x').subscribe({ error: (error) => (getStatus = error.status) });
    http.post('/api/v1/y', {}).subscribe({ error: (error) => (postStatus = error.status) });

    controller.expectOne('/api/v1/x').flush(null, { status: 500, statusText: 'Error' });
    controller.expectOne('/api/v1/y').flush(null, tooMany);
    vi.advanceTimersByTime(RATE_LIMIT_MAX_DELAY_MS);

    expect(getStatus).toBe(500);
    expect(postStatus).toBe(429);
  });
});

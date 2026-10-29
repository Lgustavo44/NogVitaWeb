import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SLOW_REQUEST_MS, ServerWake, serverWakeInterceptor } from './server-wake';

describe('serverWakeInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let serverWake: ServerWake;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([serverWakeInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    serverWake = TestBed.inject(ServerWake);
  });

  afterEach(() => {
    controller.verify();
    vi.useRealTimers();
  });

  it('não avisa quando a resposta chega rápido', () => {
    http.get('/health').subscribe();
    vi.advanceTimersByTime(SLOW_REQUEST_MS - 1);
    controller.expectOne('/health').flush('Healthy');
    vi.advanceTimersByTime(SLOW_REQUEST_MS);

    expect(serverWake.waking()).toBe(false);
  });

  it('avisa enquanto a requisição está lenta e para quando ela termina', () => {
    http.get('/health').subscribe();
    vi.advanceTimersByTime(SLOW_REQUEST_MS);

    expect(serverWake.waking()).toBe(true);

    controller.expectOne('/health').flush('Healthy');

    expect(serverWake.waking()).toBe(false);
  });

  it('também para de avisar quando a requisição lenta falha', () => {
    http.get('/health').subscribe({ error: () => undefined });
    vi.advanceTimersByTime(SLOW_REQUEST_MS);
    controller.expectOne('/health').flush(null, { status: 502, statusText: 'Bad Gateway' });

    expect(serverWake.waking()).toBe(false);
  });
});

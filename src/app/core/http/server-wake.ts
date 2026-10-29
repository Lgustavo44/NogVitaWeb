import { HttpInterceptorFn } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

/** Depois desse tempo sem resposta, avisamos que o servidor pode estar acordando. */
export const SLOW_REQUEST_MS = 4000;

/**
 * O staging dorme depois de 15 minutos sem uso, e a primeira requisição leva cerca de 1 minuto.
 * Não há timeout curto de propósito: só avisamos a pessoa enquanto houver requisições lentas.
 */
@Service()
export class ServerWake {
  private readonly slowRequests = signal(0);
  readonly waking = computed(() => this.slowRequests() > 0);

  requestBecameSlow(): void {
    this.slowRequests.update((count) => count + 1);
  }

  slowRequestEnded(): void {
    this.slowRequests.update((count) => Math.max(0, count - 1));
  }
}

export const serverWakeInterceptor: HttpInterceptorFn = (request, next) => {
  const serverWake = inject(ServerWake);
  let slow = false;
  const timer = setTimeout(() => {
    slow = true;
    serverWake.requestBecameSlow();
  }, SLOW_REQUEST_MS);

  return next(request).pipe(
    finalize(() => {
      clearTimeout(timer);
      if (slow) {
        serverWake.slowRequestEnded();
      }
    }),
  );
};

import { Service, computed, signal } from '@angular/core';
import { AuthResponse } from './auth.models';

/**
 * Os tokens da sessão atual.
 * Por enquanto ficam só em memória (recarregar a página desloga): onde guardá-los é a decisão D15.
 */
@Service()
export class Session {
  private readonly tokens = signal<AuthResponse | null>(null);

  readonly isAuthenticated = computed(() => this.tokens() !== null);
  readonly refreshToken = computed(() => this.tokens()?.refreshToken ?? null);

  start(tokens: AuthResponse): void {
    this.tokens.set(tokens);
  }

  clear(): void {
    this.tokens.set(null);
  }
}

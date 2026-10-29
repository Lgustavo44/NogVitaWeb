import { DOCUMENT } from '@angular/common';
import { Service, computed, inject, signal } from '@angular/core';
import { AuthResponse } from './auth.models';

/**
 * Os tokens da sessão atual ficam na aba para sobreviver a recarregamentos.
 * Ao fechar a aba, o sessionStorage é descartado.
 */
@Service()
export class Session {
  private readonly document = inject(DOCUMENT);
  private readonly tokens = signal<AuthResponse | null>(this.readStoredTokens());

  readonly isAuthenticated = computed(() => this.tokens() !== null);
  readonly accessToken = computed(() => this.tokens()?.accessToken ?? null);
  readonly refreshToken = computed(() => this.tokens()?.refreshToken ?? null);

  start(tokens: AuthResponse): void {
    this.tokens.set(tokens);
    this.persist(tokens);
  }

  clear(): void {
    this.tokens.set(null);
    this.document.defaultView?.sessionStorage.removeItem(STORAGE_KEY);
  }

  private readStoredTokens(): AuthResponse | null {
    const stored = this.document.defaultView?.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    try {
      const tokens: unknown = JSON.parse(stored);
      return isAuthResponse(tokens) ? tokens : null;
    } catch {
      this.document.defaultView?.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  private persist(tokens: AuthResponse): void {
    this.document.defaultView?.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  }
}

const STORAGE_KEY = 'nogvita-session';

function isAuthResponse(value: unknown): value is AuthResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const tokens = value as Record<string, unknown>;
  return (
    typeof tokens['accessToken'] === 'string' &&
    typeof tokens['accessTokenExpiresAtUtc'] === 'string' &&
    typeof tokens['refreshToken'] === 'string' &&
    typeof tokens['refreshTokenExpiresAtUtc'] === 'string'
  );
}

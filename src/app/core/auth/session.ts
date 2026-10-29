import { DOCUMENT, Service, computed, inject, signal } from '@angular/core';
import { AuthResponse } from './auth.models';

const STORAGE_KEY = 'nogvita-session';

/**
 * Os tokens da sessão atual (D15: sessionStorage).
 * Sobrevivem ao recarregar a página e somem ao fechar a aba.
 * Quem inicia e encerra a sessão é o serviço `Auth`; aqui só se guarda e se lê.
 */
@Service()
export class Session {
  private readonly storage = sessionStorageOf(inject(DOCUMENT));
  private readonly tokens = signal<AuthResponse | null>(this.read());

  readonly isAuthenticated = computed(() => this.tokens() !== null);
  readonly accessToken = computed(() => this.tokens()?.accessToken ?? null);
  readonly refreshToken = computed(() => this.tokens()?.refreshToken ?? null);

  /** Se o access token vence nos próximos `marginMs` (renova antes de a API recusar). */
  accessTokenExpiresSoon(marginMs = 30_000): boolean {
    const tokens = this.tokens();
    return tokens !== null && Date.parse(tokens.accessTokenExpiresAtUtc) - Date.now() < marginMs;
  }

  store(tokens: AuthResponse): void {
    this.tokens.set(tokens);
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(tokens));
    } catch {
      // Armazenamento cheio ou bloqueado: a sessão vale só enquanto a página estiver aberta.
    }
  }

  clear(): void {
    this.tokens.set(null);
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      // Nada a fazer: o estado em memória já foi limpo.
    }
  }

  private read(): AuthResponse | null {
    try {
      const stored = this.storage?.getItem(STORAGE_KEY);
      const tokens: unknown = stored ? JSON.parse(stored) : null;
      return isAuthResponse(tokens) ? tokens : null;
    } catch {
      return null;
    }
  }
}

/** Em navegação privada ou com cookies bloqueados, só acessar o sessionStorage já pode lançar erro. */
function sessionStorageOf(document: Document): Storage | null {
  try {
    return document.defaultView?.sessionStorage ?? null;
  } catch {
    return null;
  }
}

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

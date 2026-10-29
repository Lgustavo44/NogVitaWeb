import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';

/** Só aparece se a navegação demorar, para não piscar nas trocas rápidas. */
const SHOW_AFTER_MS = 150;

/**
 * Barra fina no topo enquanto a navegação não termina: carregamento de tela sob demanda
 * ou guard esperando a API (ex.: `GET /auth/me` no cold start).
 */
@Component({
  selector: 'app-navigation-progress',
  template: `
    @if (visible()) {
      <div
        class="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-primary/20"
        role="progressbar"
        aria-label="Carregando a página"
      >
        <div class="nv-progress-bar h-full w-1/3 bg-primary"></div>
      </div>
    }
  `,
  styles: `
    .nv-progress-bar {
      animation: nv-progress 1.1s ease-in-out infinite;
    }
    @keyframes nv-progress {
      from {
        transform: translateX(-100%);
      }
      to {
        transform: translateX(300%);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .nv-progress-bar {
        animation: none;
        width: 100%;
        opacity: 0.6;
      }
    }
  `,
})
export class NavigationProgress {
  protected readonly visible = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          clearTimeout(this.timer);
          this.timer = setTimeout(() => this.visible.set(true), SHOW_AFTER_MS);
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          clearTimeout(this.timer);
          this.visible.set(false);
        }
      });
  }
}

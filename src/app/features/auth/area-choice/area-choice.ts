import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideChevronRight,
  LucideDynamicIcon,
  LucideIcon,
  LucideShieldCheck,
  LucideStethoscope,
  LucideUserRound,
} from '@lucide/angular';
import { AREAS } from '../../../core/auth/areas';
import { Auth } from '../../../core/auth/auth';
import { Role } from '../../../core/auth/auth.models';
import { CurrentUser } from '../../../core/auth/current-user';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { Logo } from '../../../shared/ui/logo/logo';

const ICONS: Record<Role, LucideIcon> = {
  Patient: LucideUserRound,
  Nutritionist: LucideStethoscope,
  Admin: LucideShieldCheck,
};

/**
 * Para onde a pessoa vai depois do login. Com um papel só, segue direto para a área;
 * com mais de um (ex.: paciente e nutricionista), escolhe.
 */
@Component({
  selector: 'app-area-choice',
  imports: [LoadError, Logo, LucideChevronRight, LucideDynamicIcon, RouterLink],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <div class="flex flex-col items-center gap-4 text-center">
      <app-logo class="h-10" priority />
      @if (state() === 'ready') {
        <div class="flex flex-col gap-1">
          <h1 class="text-headline-lg text-ink">Escolha a área</h1>
          <p class="text-body-md text-ink-muted">
            Sua conta tem mais de um perfil. Você pode trocar depois, pelo menu da conta.
          </p>
        </div>
      } @else {
        <h1 class="text-headline-lg text-ink">Entrando…</h1>
      }
    </div>

    @if (state() === 'loading') {
      <div class="flex flex-col gap-3" aria-hidden="true">
        @for (item of [1, 2]; track item) {
          <div class="h-20 rounded-container bg-surface-muted motion-safe:animate-pulse"></div>
        }
      </div>
      <p class="sr-only" role="status">Carregando sua conta…</p>
    } @else if (state() === 'error') {
      <app-load-error [error]="error()" (retry)="load()" />
    } @else {
      <ul class="flex flex-col gap-3">
        @for (area of areas(); track area.role) {
          <li>
            <a
              [routerLink]="area.path"
              class="flex items-center gap-4 rounded-container border border-divider bg-surface p-4 transition-colors hover:border-primary hover:bg-soft/10"
            >
              <span
                class="flex size-12 shrink-0 items-center justify-center rounded-full bg-soft text-on-soft"
              >
                <svg [lucideIcon]="area.icon" class="size-6"></svg>
              </span>
              <span class="flex min-w-0 flex-col">
                <span class="text-title-md text-ink">{{ area.label }}</span>
                <span class="text-body-md text-ink-muted">{{ area.description }}</span>
              </span>
              <svg lucideChevronRight class="ml-auto size-5 shrink-0 text-ink-muted"></svg>
            </a>
          </li>
        }
      </ul>
    }

    <button
      type="button"
      class="cursor-pointer text-center text-label-lg text-link hover:underline"
      (click)="logout()"
    >
      Sair e entrar com outra conta
    </button>
  `,
})
export class AreaChoice {
  private readonly auth = inject(Auth);
  private readonly currentUser = inject(CurrentUser);
  private readonly router = inject(Router);

  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly error = signal<unknown>(null);
  protected readonly areas = computed(() =>
    this.currentUser.roles().map((role) => ({ ...AREAS[role], icon: ICONS[role] })),
  );

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.state.set('loading');
    try {
      const { roles } = await this.currentUser.load();
      if (roles.length === 1) {
        await this.router.navigateByUrl(AREAS[roles[0]].path, { replaceUrl: true });
        return;
      }
      if (roles.length === 0) {
        // Conta sem nenhum papel conhecido: não há para onde ir.
        await this.auth.logout('/sem-permissao');
        return;
      }
      this.state.set('ready');
    } catch (error) {
      this.error.set(error);
      this.state.set('error');
    }
  }

  protected logout(): void {
    void this.auth.logout();
  }
}

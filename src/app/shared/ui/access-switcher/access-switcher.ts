import { Component, input, output, signal } from '@angular/core';
import { LucideCheck, LucideChevronDown, LucideShield, LucideStethoscope, LucideUserRound } from '@lucide/angular';
import { AccessRole } from '../../../core/auth/access-context';

@Component({
  selector: 'app-access-switcher',
  imports: [LucideCheck, LucideChevronDown, LucideShield, LucideStethoscope, LucideUserRound],
  template: `
    <div class="relative">
      <button
        type="button"
        class="flex items-center gap-2 rounded-pill border border-divider bg-surface px-3 py-2 text-label-md text-ink shadow-1 transition hover:border-primary hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        [attr.aria-expanded]="open()"
        aria-haspopup="listbox"
        aria-label="Selecionar contexto de acesso"
        (click)="open.update((value) => !value)"
      >
        <span class="flex size-6 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed">
          @switch (active()) {
            @case ('Admin') { <svg lucideShield class="size-3.5"></svg> }
            @case ('Nutritionist') { <svg lucideStethoscope class="size-3.5"></svg> }
            @default { <svg lucideUserRound class="size-3.5"></svg> }
          }
        </span>
        <span class="hidden sm:inline">Área:</span>
        <strong>{{ label(active()) }}</strong>
        <svg lucideChevronDown class="size-4 transition-transform" [class.rotate-180]="open()"></svg>
      </button>

      @if (open()) {
        <div
          class="absolute right-0 top-full z-50 mt-2 min-w-56 overflow-hidden rounded-container border border-divider bg-surface p-1.5 shadow-3"
          role="listbox"
          aria-label="Contextos disponíveis"
        >
          <p class="px-3 py-2 text-label-sm uppercase tracking-wider text-ink-muted">Trocar contexto</p>
          @for (role of roles(); track role) {
            <button
              type="button"
              role="option"
              class="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left text-label-lg transition hover:bg-surface-muted"
              [class.bg-primary-fixed]="role === active()"
              [attr.aria-selected]="role === active()"
              (click)="select(role)"
            >
              <span class="flex size-8 items-center justify-center rounded-full" [class]="role === active() ? 'bg-primary text-on-primary' : 'bg-surface-muted text-ink-muted'">
                @switch (role) {
                  @case ('Admin') { <svg lucideShield class="size-4"></svg> }
                  @case ('Nutritionist') { <svg lucideStethoscope class="size-4"></svg> }
                  @default { <svg lucideUserRound class="size-4"></svg> }
                }
              </span>
              <span class="flex-1">{{ label(role) }}</span>
              @if (role === active()) {
                <svg lucideCheck class="size-4 text-primary"></svg>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class AccessSwitcher {
  readonly roles = input.required<AccessRole[]>();
  readonly active = input.required<AccessRole>();
  readonly roleChange = output<AccessRole>();
  protected readonly open = signal(false);

  protected select(role: AccessRole): void {
    this.open.set(false);
    if (role !== this.active()) {
      this.roleChange.emit(role);
    }
  }

  protected label(role: AccessRole): string {
    return role === 'Admin' ? 'Administrador' : role === 'Nutritionist' ? 'Nutricionista' : 'Paciente';
  }
}

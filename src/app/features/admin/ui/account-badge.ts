import { Component, booleanAttribute, computed, input } from '@angular/core';

/** Situação da conta (ou do convite). O texto sempre acompanha a cor. */
@Component({
  selector: 'app-account-badge',
  host: { class: 'inline-flex' },
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-label-sm font-semibold whitespace-nowrap"
      [class]="
        pending()
          ? 'bg-warning-soft text-warning-ink'
          : active()
            ? 'bg-success-soft text-success-ink'
            : 'bg-danger-soft text-danger-ink'
      "
    >
      <span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
      {{ label() }}
    </span>
  `,
})
export class AccountBadge {
  readonly active = input.required({ transform: booleanAttribute });
  /** Nutricionista que ainda não aceitou o convite. */
  readonly pending = input(false, { transform: booleanAttribute });
  /** "Ativo/Desativado" (alimento) em vez de "Ativa/Desativada" (conta). */
  readonly masculine = input(false, { transform: booleanAttribute });

  protected readonly label = computed(() => {
    if (this.pending()) {
      return 'Convite pendente';
    }
    const ending = this.masculine() ? 'o' : 'a';
    return this.active() ? `Ativ${ending}` : `Desativad${ending}`;
  });
}

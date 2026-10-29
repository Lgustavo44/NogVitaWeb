import { Directive, computed, inject, signal } from '@angular/core';
import { FormField } from '@angular/forms/signals';

let nextId = 0;

/**
 * Estilo e acessibilidade de um `<input>` ligado ao Signal Forms (`[formField]`).
 * Os erros só aparecem depois que a pessoa sai do campo ou tenta enviar o formulário.
 */
@Directive({
  selector: 'input[appInput]',
  host: {
    class:
      'h-11 w-full rounded-control border border-line bg-surface px-3 text-body-lg text-ink ' +
      'placeholder:text-ink-muted/70 transition-shadow ' +
      'focus:border-focus focus:outline-none focus:ring-4 focus:ring-primary/20 ' +
      'aria-invalid:border-danger disabled:opacity-60',
    '[id]': 'id',
    '[attr.aria-invalid]': 'showErrors() || null',
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class FieldInput {
  private readonly formField = inject(FormField, { self: true });

  readonly id = `nv-field-${nextId++}`;
  readonly errorId = `${this.id}-error`;
  readonly hintId = `${this.id}-hint`;

  readonly showErrors = computed(() => {
    const state = this.formField.state();
    return state.touched() && state.invalid();
  });

  readonly errorMessages = computed(() =>
    this.showErrors()
      ? this.formField.errors().map((error) => error.message ?? 'Valor inválido.')
      : [],
  );

  /** Ligado pelo app-field quando há uma dica abaixo do campo. */
  readonly hasHint = signal(false);

  protected readonly describedBy = computed(() => {
    if (this.showErrors()) {
      return this.errorId;
    }
    return this.hasHint() ? this.hintId : null;
  });
}

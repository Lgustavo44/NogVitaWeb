import { Component, contentChild, effect, input } from '@angular/core';
import { LucideCircleAlert } from '@lucide/angular';
import { FieldInput } from './field-input';

/**
 * Rótulo, campo, dica e mensagens de erro.
 * Projeções: o `<input appInput>`, ícones posicionados com `absolute` e,
 * com o atributo `fieldAction`, um link ao lado do rótulo (ex.: "Esqueci minha senha").
 */
@Component({
  selector: 'app-field',
  imports: [LucideCircleAlert],
  host: { class: 'flex flex-col gap-1.5' },
  template: `
    <div class="flex items-center justify-between gap-2">
      <label [for]="control().id" class="text-label-md text-ink">{{ label() }}</label>
      <ng-content select="[fieldAction]" />
    </div>
    <div class="relative flex items-center">
      <ng-content />
    </div>
    @if (control().showErrors()) {
      <ul [id]="control().errorId" class="flex flex-col gap-1 text-body-sm text-danger-ink">
        @for (message of control().errorMessages(); track $index) {
          <li class="flex items-start gap-1.5">
            <svg lucideCircleAlert class="mt-px size-4 shrink-0"></svg>
            <span>{{ message }}</span>
          </li>
        }
      </ul>
    } @else if (hint()) {
      <p [id]="control().hintId" class="text-body-sm text-ink-muted">{{ hint() }}</p>
    }
  `,
})
export class Field {
  readonly label = input.required<string>();
  readonly hint = input<string>();

  protected readonly control = contentChild.required(FieldInput);

  constructor() {
    effect(() => {
      this.control().hasHint.set(!!this.hint());
    });
  }
}

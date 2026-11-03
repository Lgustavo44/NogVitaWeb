import { Component, input, model } from '@angular/core';
import { HealthDataConsentTerm } from './health-data-consent';

let nextId = 0;

/**
 * Os dois aceites do termo, cada um com o seu texto e o seu checkbox, sempre desmarcados no início.
 * Usado no cadastro e no pedido de aceite de quem já era paciente.
 */
@Component({
  selector: 'app-health-data-consent-checks',
  host: { class: 'flex flex-col gap-3' },
  template: `
    @for (item of items; track item.key) {
      <div class="flex flex-col gap-1.5">
        <label
          class="flex cursor-pointer items-start gap-3 rounded-control border border-line bg-surface p-4 has-checked:border-primary has-checked:bg-soft/20"
        >
          <input
            type="checkbox"
            class="mt-0.5 size-5 shrink-0 accent-primary"
            [checked]="item.checked()"
            (change)="item.checked.set($any($event.target).checked)"
            [attr.aria-invalid]="item.error() ? true : null"
            [attr.aria-describedby]="item.error() ? id + '-' + item.key + '-error' : null"
          />
          <span class="flex flex-col gap-1">
            <span class="text-label-lg text-ink">{{ item.title }}</span>
            <span class="text-body-sm whitespace-pre-line text-ink-muted">{{ item.text() }}</span>
          </span>
        </label>
        @if (item.error(); as message) {
          <p [id]="id + '-' + item.key + '-error'" class="text-body-sm text-danger-ink">
            {{ message }}
          </p>
        }
      </div>
    }
  `,
})
export class HealthDataConsentChecks {
  readonly term = input.required<HealthDataConsentTerm>();
  readonly healthData = model.required<boolean>();
  readonly internationalTransfer = model.required<boolean>();
  readonly healthDataError = input<string | null>(null);
  readonly internationalTransferError = input<string | null>(null);

  protected readonly id = `nv-consent-${nextId++}`;
  protected readonly items = [
    {
      key: 'saude',
      title: 'Autorizo o uso dos meus dados de saúde',
      text: () => this.term().healthDataText,
      checked: this.healthData,
      error: this.healthDataError,
    },
    {
      key: 'transferencia',
      title: 'Autorizo a guarda dos meus dados em serviços fora do Brasil',
      text: () => this.term().internationalTransferText,
      checked: this.internationalTransfer,
      error: this.internationalTransferError,
    },
  ];
}

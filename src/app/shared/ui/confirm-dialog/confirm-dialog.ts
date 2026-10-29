import { Component, booleanAttribute, input, output } from '@angular/core';
import { LucideCircleHelp, LucideTriangleAlert } from '@lucide/angular';
import { Alert } from '../alert/alert';
import { Button } from '../button/button';
import { Modal } from '../modal/modal';

/**
 * Confirmação de uma ação: o texto vai no conteúdo, e o erro da API aparece dentro do diálogo.
 * Uso: `@if (perguntando()) { <app-confirm-dialog heading="..." (confirmed)="..." (closed)="...">texto</app-confirm-dialog> }`
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [Alert, Button, LucideCircleHelp, LucideTriangleAlert, Modal],
  template: `
    <app-modal
      [heading]="heading()"
      [subtitle]="subtitle()"
      size="sm"
      [alert]="tone() === 'danger'"
      [busy]="busy()"
      (closed)="closed.emit()"
    >
      <span
        modalIcon
        class="flex size-10 shrink-0 items-center justify-center rounded-full"
        [class]="
          tone() === 'danger' ? 'bg-danger-soft text-danger-ink' : 'bg-soft/40 text-soft-ink'
        "
      >
        @if (tone() === 'danger') {
          <svg lucideTriangleAlert class="size-5"></svg>
        } @else {
          <svg lucideCircleHelp class="size-5"></svg>
        }
      </span>
      <div class="flex flex-col gap-2 text-body-md text-ink"><ng-content /></div>
      @if (error(); as message) {
        <app-alert tone="danger">{{ message }}</app-alert>
      }
      <ng-container modalActions>
        <button appButton variant="soft" type="button" [disabled]="busy()" (click)="closed.emit()">
          {{ cancelLabel() }}
        </button>
        <button
          appButton
          [variant]="tone() === 'danger' ? 'danger' : 'primary'"
          type="button"
          [loading]="busy()"
          (click)="confirmed.emit()"
        >
          {{ confirmLabel() }}
        </button>
      </ng-container>
    </app-modal>
  `,
})
export class ConfirmDialog {
  readonly heading = input.required<string>();
  readonly subtitle = input<string>();
  readonly confirmLabel = input.required<string>();
  readonly cancelLabel = input('Voltar');
  readonly tone = input<'primary' | 'danger'>('primary');
  readonly busy = input(false, { transform: booleanAttribute });
  readonly error = input<string | null>(null);
  readonly confirmed = output();
  readonly closed = output();
}

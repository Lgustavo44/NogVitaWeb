import { Component, computed, input } from '@angular/core';
import { PLAN_STATUS_LABELS, PlanStatus } from '../domain/nutrition-plan';

const STATUS_CLASSES: Record<PlanStatus, string> = {
  Draft: 'bg-surface-muted text-ink-muted border border-line',
  Active: 'bg-success-soft text-success-ink',
  Finished: 'bg-info-soft text-info-ink',
  Cancelled: 'bg-danger-soft text-danger-ink',
};

/** Selo do status do plano. O texto sempre acompanha a cor. */
@Component({
  selector: 'app-plan-status-badge',
  host: { class: 'inline-flex' },
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-label-sm font-semibold"
      [class]="classes()"
    >
      <span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
      {{ label() }}
    </span>
  `,
})
export class PlanStatusBadge {
  readonly status = input.required<PlanStatus>();

  protected readonly label = computed(() => PLAN_STATUS_LABELS[this.status()]);
  protected readonly classes = computed(() => STATUS_CLASSES[this.status()]);
}

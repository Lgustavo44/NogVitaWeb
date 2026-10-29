import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { LucideTrash2 } from '@lucide/angular';
import { WeightRecord } from '../domain/weight';

/** Quem está vendo: define o rótulo de autoria e quais registros podem ser apagados. */
export type WeightPerspective = 'patient' | 'nutritionist';

interface HistoryRow {
  record: WeightRecord;
  /** Diferença para o registro anterior (mais antigo); null no primeiro. */
  change: number | null;
  author: string;
  canDelete: boolean;
}

/**
 * Histórico de peso: tabela no tablet e no desktop, cards no celular.
 * A API só deixa apagar o que a própria pessoa registrou (o resto responde 404).
 */
@Component({
  selector: 'app-weight-history',
  imports: [DatePipe, DecimalPipe, LucideTrash2],
  template: `
    <!-- Celular: cards -->
    <ul class="flex flex-col divide-y divide-divider md:hidden">
      @for (row of rows(); track row.record.id) {
        <li class="flex items-start justify-between gap-3 py-3">
          <div class="min-w-0">
            <p class="text-label-lg text-ink tabular-nums">
              {{ row.record.weightKg | number: '1.0-1' }} kg
              @if (row.change !== null) {
                <span class="ml-1 text-body-sm text-ink-muted">({{ signed(row.change) }} kg)</span>
              }
            </p>
            <p class="text-body-sm text-ink-muted">
              {{ row.record.recordedOn | date: 'dd/MM/yyyy' }} · {{ row.author }}
            </p>
            @if (row.record.notes) {
              <p class="mt-1 text-body-sm text-ink-muted">{{ row.record.notes }}</p>
            }
          </div>
          @if (row.canDelete) {
            <button
              type="button"
              class="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-muted hover:bg-danger-soft hover:text-danger-ink"
              [attr.aria-label]="
                'Apagar o registro de ' + (row.record.recordedOn | date: 'dd/MM/yyyy')
              "
              (click)="deleteRequested.emit(row.record)"
            >
              <svg lucideTrash2 class="size-5"></svg>
            </button>
          }
        </li>
      }
    </ul>

    <!-- Tablet e desktop: tabela -->
    <table class="hidden w-full text-left md:table">
      <thead>
        <tr class="border-b border-divider text-label-md text-ink-muted">
          <th scope="col" class="py-2 pr-4 font-semibold">Data</th>
          <th scope="col" class="py-2 pr-4 font-semibold">Peso</th>
          <th scope="col" class="py-2 pr-4 font-semibold">Variação</th>
          <th scope="col" class="py-2 pr-4 font-semibold">Registrado por</th>
          <th scope="col" class="py-2 pr-4 font-semibold">Observação</th>
          <th scope="col" class="py-2"><span class="sr-only">Ações</span></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-divider text-body-md">
        @for (row of rows(); track row.record.id) {
          <tr>
            <td class="py-3 pr-4 text-ink tabular-nums">
              {{ row.record.recordedOn | date: 'dd/MM/yyyy' }}
            </td>
            <td class="py-3 pr-4 font-semibold text-ink tabular-nums">
              {{ row.record.weightKg | number: '1.0-1' }} kg
            </td>
            <td class="py-3 pr-4 text-ink-muted tabular-nums">
              {{ row.change === null ? '—' : signed(row.change) + ' kg' }}
            </td>
            <td class="py-3 pr-4 text-ink-muted">{{ row.author }}</td>
            <td class="max-w-64 truncate py-3 pr-4 text-ink-muted" [attr.title]="row.record.notes">
              {{ row.record.notes || '—' }}
            </td>
            <td class="py-3 text-right">
              @if (row.canDelete) {
                <button
                  type="button"
                  class="inline-flex size-9 cursor-pointer items-center justify-center rounded-control text-ink-muted hover:bg-danger-soft hover:text-danger-ink"
                  [attr.aria-label]="
                    'Apagar o registro de ' + (row.record.recordedOn | date: 'dd/MM/yyyy')
                  "
                  (click)="deleteRequested.emit(row.record)"
                >
                  <svg lucideTrash2 class="size-4"></svg>
                </button>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class WeightHistory {
  /** Do mais recente para o mais antigo (ordem da API). */
  readonly records = input.required<WeightRecord[]>();
  readonly perspective = input.required<WeightPerspective>();
  readonly deleteRequested = output<WeightRecord>();

  protected readonly rows = computed<HistoryRow[]>(() => {
    const records = [...this.records()].sort((a, b) => b.recordedOn.localeCompare(a.recordedOn));
    const patientView = this.perspective() === 'patient';
    return records.map((record, index) => {
      const older = records[index + 1];
      const own = patientView ? record.recordedByPatient : !record.recordedByPatient;
      return {
        record,
        change: older ? record.weightKg - older.weightKg : null,
        author: patientView
          ? record.recordedByPatient
            ? 'Você'
            : record.recordedByName
          : record.recordedByPatient
            ? 'Paciente'
            : record.recordedByName,
        canDelete: own,
      };
    });
  });

  /** Variação com sinal e vírgula ("+0,4", "−1,2"). Sem cor: subir ou descer não é bom nem ruim por si. */
  protected signed(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    const text = Math.abs(rounded).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    return rounded > 0 ? `+${text}` : rounded < 0 ? `−${text}` : '0';
  }
}

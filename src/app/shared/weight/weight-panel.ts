import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { LucidePlus, LucideScale, LucideTriangleAlert } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../core/http/api-error';
import { apiUrl } from '../../core/http/api-url';
import { PagedResponse } from '../domain/paged-response';
import { RecordWeightRequest, WeightRecord } from '../domain/weight';
import { Alert } from '../ui/alert/alert';
import { Button } from '../ui/button/button';
import { LoadError } from '../ui/load-error/load-error';
import { Modal } from '../ui/modal/modal';
import { Toaster } from '../ui/toast/toaster';
import { daysAgoIsoDate } from '../util/dates';
import { WeightChart } from './weight-chart';
import { WeightFormModal } from './weight-form-modal';
import { WeightHistory, WeightPerspective } from './weight-history';

/** Máximo que a API devolve por página. */
const PAGE_SIZE = 100;

const PERIODS = [
  { value: 30, label: 'Últimos 30 dias' },
  { value: 90, label: 'Últimos 3 meses' },
  { value: 180, label: 'Últimos 6 meses' },
  { value: 365, label: 'Último ano' },
  { value: 0, label: 'Todo o histórico' },
] as const;

/**
 * Peso e evolução, igual para o paciente e para o nutricionista: período, resumo, gráfico,
 * histórico, registrar e apagar. Cada área informa só os endereços da API.
 */
@Component({
  selector: 'app-weight-panel',
  imports: [
    Alert,
    Button,
    DatePipe,
    DecimalPipe,
    LoadError,
    LucidePlus,
    LucideScale,
    LucideTriangleAlert,
    Modal,
    WeightChart,
    WeightFormModal,
    WeightHistory,
  ],
  host: { class: 'flex flex-col gap-4' },
  templateUrl: './weight-panel.html',
})
export class WeightPanel {
  private readonly http = inject(HttpClient);
  private readonly toaster = inject(Toaster);

  /** Lista e registro (GET/POST). Ex.: '/patients/me/weight-records'. */
  readonly recordsPath = input.required<string>();
  /** Base para apagar ('/{id}' é acrescentado). Ex.: '/nutritionists/me/weight-records'. */
  readonly deletePath = input.required<string>();
  readonly perspective = input.required<WeightPerspective>();
  readonly heading = input('Evolução do peso');
  /** Avisa quem usa o painel que os dados mudaram (ex.: atualizar o "último peso" do paciente). */
  readonly changed = output();

  protected readonly periods = PERIODS;
  protected readonly periodDays = signal<number>(90);
  protected readonly records = httpResource<PagedResponse<WeightRecord>>(() => {
    const days = this.periodDays();
    return {
      url: apiUrl(this.recordsPath()),
      params: { page: 1, pageSize: PAGE_SIZE, ...(days ? { from: daysAgoIsoDate(days) } : {}) },
    };
  });
  protected readonly items = computed(() =>
    this.records.hasValue() ? this.records.value().items : [],
  );
  protected readonly truncated = computed(
    () => this.records.hasValue() && this.records.value().totalItems > this.items().length,
  );
  /** Resumo do período: o mais recente e a variação desde o primeiro registro do período. */
  protected readonly summary = computed(() => {
    const sorted = [...this.items()].sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));
    if (sorted.length === 0) {
      return null;
    }
    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    return { latest, first, change: latest.weightKg - first.weightKg, count: sorted.length };
  });

  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly deleteTarget = signal<WeightRecord | null>(null);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  protected readonly sameDayHint = computed(() =>
    this.perspective() === 'patient'
      ? 'Se você já registrou nesta data, o registro será atualizado. Um registro feito pelo seu nutricionista não pode ser substituído.'
      : 'Se você já registrou nesta data, o registro será atualizado. Um registro feito pelo paciente não pode ser substituído.',
  );

  protected onPeriod(event: Event): void {
    this.periodDays.set(Number((event.target as HTMLSelectElement).value));
  }

  protected openForm(): void {
    this.saveError.set(null);
    this.formOpen.set(true);
  }

  protected async save(body: RecordWeightRequest): Promise<void> {
    this.saving.set(true);
    this.saveError.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post(apiUrl(this.recordsPath()), body, { observe: 'response' }),
      );
      this.formOpen.set(false);
      // 201: registro novo. 200: já havia um registro seu nesta data, e ele foi atualizado.
      this.toaster.show(
        response.status === 200 ? 'Registro do dia atualizado.' : 'Peso registrado.',
      );
      this.afterChange();
    } catch (error) {
      this.saveError.set(toApiError(error).message);
    } finally {
      this.saving.set(false);
    }
  }

  protected askDelete(record: WeightRecord): void {
    this.deleteError.set(null);
    this.deleteTarget.set(record);
  }

  protected async confirmDelete(): Promise<void> {
    const record = this.deleteTarget();
    if (!record || this.deleting()) {
      return;
    }
    this.deleting.set(true);
    this.deleteError.set(null);
    try {
      await firstValueFrom(this.http.delete(apiUrl(`${this.deletePath()}/${record.id}`)));
      this.deleteTarget.set(null);
      this.toaster.show('Registro apagado.');
      this.afterChange();
    } catch (error) {
      this.deleteError.set(toApiError(error).message);
    } finally {
      this.deleting.set(false);
    }
  }

  /** Variação com sinal e vírgula. Sem cor: perder ou ganhar peso depende do objetivo. */
  protected signed(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    const text = Math.abs(rounded).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    return rounded > 0 ? `+${text}` : rounded < 0 ? `−${text}` : '0';
  }

  private afterChange(): void {
    this.records.reload();
    this.changed.emit();
  }
}

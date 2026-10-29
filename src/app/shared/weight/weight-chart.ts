import { DatePipe, DecimalPipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { WeightRecord } from '../domain/weight';
import { localIsoDate, parseIsoDate } from '../util/dates';

const HEIGHT = 240;
const MARGIN = { top: 16, right: 16, bottom: 28, left: 44 };

interface ChartPoint {
  record: WeightRecord;
  x: number;
  y: number;
}

/**
 * Evolução do peso: uma série só, então sem legenda (o título da seção a nomeia).
 * Eixo X proporcional às datas (intervalos irregulares ficam visíveis); linha-guia e dica no hover;
 * setas do teclado percorrem os pontos. A tabela do histórico é a alternativa em texto.
 */
@Component({
  selector: 'app-weight-chart',
  imports: [DatePipe, DecimalPipe],
  host: { class: 'relative block' },
  template: `
    <div
      tabindex="0"
      role="group"
      [attr.aria-label]="summary()"
      class="relative rounded-control outline-offset-4"
      (keydown)="onKey($event)"
      (blur)="active.set(null)"
    >
      <svg
        [attr.width]="width()"
        [attr.height]="height"
        class="block touch-pan-y select-none"
        aria-hidden="true"
        (pointermove)="onPointer($event)"
        (pointerleave)="active.set(null)"
      >
        @for (tick of yTicks(); track tick.value) {
          <line
            [attr.x1]="margin.left"
            [attr.x2]="width() - margin.right"
            [attr.y1]="tick.y"
            [attr.y2]="tick.y"
            class="stroke-divider"
            stroke-width="1"
          />
          <text
            [attr.x]="margin.left - 8"
            [attr.y]="tick.y"
            text-anchor="end"
            dominant-baseline="middle"
            class="fill-ink-muted text-body-sm tabular-nums"
          >
            {{ tick.value | number: '1.0-1' }}
          </text>
        }
        @for (label of xLabels(); track label.x) {
          <text
            [attr.x]="label.x"
            [attr.y]="height - 8"
            [attr.text-anchor]="label.anchor"
            class="fill-ink-muted text-body-sm tabular-nums"
          >
            {{ label.date | date: 'dd/MM' }}
          </text>
        }

        @if (points().length > 1) {
          <path [attr.d]="areaPath()" class="fill-chart-line" fill-opacity="0.08" />
          <path
            [attr.d]="linePath()"
            fill="none"
            class="stroke-chart-line"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
        }

        @if (activePoint(); as point) {
          <line
            [attr.x1]="point.x"
            [attr.x2]="point.x"
            [attr.y1]="margin.top"
            [attr.y2]="height - margin.bottom"
            class="stroke-line"
            stroke-width="1"
            stroke-dasharray="3 3"
          />
        }

        @for (point of points(); track point.record.id; let index = $index) {
          <circle
            [attr.cx]="point.x"
            [attr.cy]="point.y"
            [attr.r]="index === active() ? 6 : 4"
            class="fill-chart-line stroke-surface"
            stroke-width="2"
          />
        }
      </svg>

      @if (activePoint(); as point) {
        <div
          class="pointer-events-none absolute z-10 w-max -translate-x-1/2 -translate-y-full rounded-control bg-surface-raised px-3 py-2 text-body-sm shadow-3"
          [style.left.px]="tooltipX(point)"
          [style.top.px]="point.y - 12"
        >
          <p class="font-semibold text-ink tabular-nums">
            {{ point.record.weightKg | number: '1.0-1' }} kg
          </p>
          <p class="text-ink-muted">{{ point.record.recordedOn | date: 'dd/MM/yyyy' }}</p>
        </div>
      }
    </div>
    <p class="sr-only" aria-live="polite">
      @if (activePoint(); as point) {
        {{ point.record.weightKg | number: '1.0-1' }} quilos em
        {{ point.record.recordedOn | date: 'dd/MM/yyyy' }}
      }
    </p>
  `,
})
export class WeightChart {
  /** Em qualquer ordem; o gráfico ordena do mais antigo para o mais recente. */
  readonly records = input.required<WeightRecord[]>();

  protected readonly height = HEIGHT;
  protected readonly margin = MARGIN;
  protected readonly width = signal(600);
  protected readonly active = signal<number | null>(null);

  private readonly sorted = computed(() =>
    [...this.records()].sort((a, b) => a.recordedOn.localeCompare(b.recordedOn)),
  );

  /** Escala Y com folga e passos "redondos" (0,5 / 1 / 2 / 5 / 10 kg). */
  private readonly yScale = computed(() => {
    const weights = this.sorted().map((r) => r.weightKg);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const padding = Math.max(0.5, (max - min) * 0.15);
    const step = niceStep((max - min + padding * 2) / 4);
    const low = Math.floor((min - padding) / step) * step;
    const high = Math.ceil((max + padding) / step) * step;
    return { low, high, step };
  });

  private readonly xScale = computed(() => {
    const times = this.sorted().map((r) => parseIsoDate(r.recordedOn).getTime());
    return { first: times[0] ?? 0, last: times[times.length - 1] ?? 0 };
  });

  protected readonly points = computed<ChartPoint[]>(() => {
    const { low, high } = this.yScale();
    const { first, last } = this.xScale();
    const plotWidth = this.width() - MARGIN.left - MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    return this.sorted().map((record) => {
      const time = parseIsoDate(record.recordedOn).getTime();
      const ratio = last === first ? 0.5 : (time - first) / (last - first);
      return {
        record,
        x: MARGIN.left + ratio * plotWidth,
        y: MARGIN.top + (1 - (record.weightKg - low) / (high - low)) * plotHeight,
      };
    });
  });

  protected readonly yTicks = computed(() => {
    const { low, high, step } = this.yScale();
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const ticks: { value: number; y: number }[] = [];
    for (let value = low; value <= high + step / 2; value += step) {
      ticks.push({ value, y: MARGIN.top + (1 - (value - low) / (high - low)) * plotHeight });
    }
    return ticks;
  });

  /** Só a primeira e a última data (e a do meio, se couber): rótulo seletivo, sem poluir. */
  protected readonly xLabels = computed(() => {
    const points = this.points();
    if (points.length === 0) {
      return [];
    }
    const first = points[0];
    const last = points[points.length - 1];
    const labels = [{ x: first.x, date: first.record.recordedOn, anchor: 'start' }];
    if (points.length > 2 && this.width() > 420) {
      // No meio do tempo (não no ponto do meio): com registros concentrados no fim,
      // o ponto do meio ficaria colado no último rótulo.
      const { first: firstTime, last: lastTime } = this.xScale();
      const middle = new Date((firstTime + lastTime) / 2);
      labels.push({ x: (first.x + last.x) / 2, date: localIsoDate(middle), anchor: 'middle' });
    }
    if (points.length > 1) {
      labels.push({ x: last.x, date: last.record.recordedOn, anchor: 'end' });
    }
    return labels;
  });

  protected readonly linePath = computed(() =>
    this.points()
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' '),
  );

  protected readonly areaPath = computed(() => {
    const points = this.points();
    const baseline = HEIGHT - MARGIN.bottom;
    return `${this.linePath()} L${points[points.length - 1].x.toFixed(1)},${baseline} L${points[0].x.toFixed(1)},${baseline} Z`;
  });

  protected readonly activePoint = computed(() => {
    const index = this.active();
    return index === null ? null : (this.points()[index] ?? null);
  });

  protected readonly summary = computed(() => {
    const sorted = this.sorted();
    if (sorted.length === 0) {
      return 'Gráfico de peso sem registros.';
    }
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const format = (r: WeightRecord) =>
      `${r.weightKg.toLocaleString('pt-BR')} quilos em ${parseIsoDate(r.recordedOn).toLocaleDateString('pt-BR')}`;
    return `Gráfico de peso com ${sorted.length} registros, de ${format(first)} a ${format(last)}. Use as setas para percorrer os pontos.`;
  });

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      // Sem ResizeObserver (testes, navegadores antigos), o gráfico fica na largura padrão.
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(([entry]) =>
        this.width.set(Math.max(240, Math.floor(entry.contentRect.width))),
      );
      observer.observe(host);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected onPointer(event: PointerEvent): void {
    const svg = event.currentTarget as SVGElement;
    const x = event.clientX - svg.getBoundingClientRect().left;
    let nearest = 0;
    this.points().forEach((point, index) => {
      if (Math.abs(point.x - x) < Math.abs(this.points()[nearest].x - x)) {
        nearest = index;
      }
    });
    this.active.set(this.points().length ? nearest : null);
  }

  protected onKey(event: KeyboardEvent): void {
    const count = this.points().length;
    if (count === 0) {
      return;
    }
    const current = this.active() ?? count - 1;
    const moves: Record<string, number> = {
      ArrowLeft: Math.max(0, current - 1),
      ArrowRight: Math.min(count - 1, current + 1),
      Home: 0,
      End: count - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      this.active.set(this.active() === null ? count - 1 : moves[event.key]);
    } else if (event.key === 'Escape') {
      this.active.set(null);
    }
  }

  /** Mantém a dica dentro do gráfico nas pontas. */
  protected tooltipX(point: ChartPoint): number {
    return Math.min(Math.max(point.x, 60), this.width() - 60);
  }
}

function niceStep(raw: number): number {
  const steps = [0.5, 1, 2, 5, 10, 20];
  return steps.find((step) => step >= raw) ?? 50;
}

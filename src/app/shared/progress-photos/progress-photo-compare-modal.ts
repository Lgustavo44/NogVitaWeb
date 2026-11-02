import { DatePipe, DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { apiUrl } from '../../core/http/api-url';
import { PagedResponse } from '../domain/paged-response';
import { WeightRecord } from '../domain/weight';
import { Modal } from '../ui/modal/modal';
import { parseIsoDate } from '../util/dates';
import {
  PHOTO_ANGLES,
  PHOTO_ANGLE_LABELS,
  PhotoAngle,
  ProgressPhoto,
  ProgressPhotoDay,
  photoAt,
} from './progress-photos.models';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Duas datas lado a lado, no mesmo ângulo e na mesma proporção (nenhuma é cortada para
 * caber na outra). Mostra o peso registrado no dia de cada foto, quando houver.
 */
@Component({
  selector: 'app-progress-photo-compare-modal',
  imports: [DatePipe, DecimalPipe, Modal],
  template: `
    <app-modal
      heading="Comparar fotos"
      subtitle="Mesmo ângulo, duas datas."
      (closed)="closed.emit()"
    >
      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-1.5">
          <span id="comparar-angulo" class="text-label-md text-ink">Ângulo</span>
          <div
            class="flex gap-1 rounded-container bg-surface-muted p-1 sm:max-w-sm"
            role="group"
            aria-labelledby="comparar-angulo"
          >
            @for (option of angles; track option) {
              <button
                type="button"
                class="min-h-10 flex-1 cursor-pointer rounded-control px-2 text-label-lg text-ink-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:bg-surface aria-pressed:font-semibold aria-pressed:text-ink aria-pressed:shadow-1"
                [attr.aria-pressed]="angle() === option"
                [disabled]="datesFor(option).length < 2"
                (click)="angle.set(option)"
              >
                {{ labels[option] }}
              </button>
            }
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:gap-4">
          @for (side of sides; track side.key) {
            <figure class="flex min-w-0 flex-col gap-2">
              <label class="flex flex-col gap-1.5">
                <span class="text-label-md text-ink">{{ side.label }}</span>
                <select
                  class="h-11 w-full rounded-control border border-line bg-surface px-3 text-body-md text-ink focus:border-focus focus:ring-4 focus:ring-primary/20 focus:outline-none"
                  (change)="pick(side.key, $event)"
                >
                  <!-- [selected] na opção: um [value] no select chega antes das opções e cai na primeira -->
                  @for (date of dates(); track date) {
                    <option
                      [value]="date"
                      [selected]="date === (side.key === 'before' ? before() : after())"
                    >
                      {{ date | date: 'dd/MM/yyyy' }}
                    </option>
                  }
                </select>
              </label>
              @if (photoFor(side.key); as photo) {
                <img
                  [src]="photo.url"
                  [alt]="labels[photo.angle] + ' em ' + (photo.takenOn | date: 'dd/MM/yyyy')"
                  class="aspect-[3/4] w-full rounded-container bg-surface-muted object-contain"
                  width="600"
                  height="800"
                  (error)="imageFailed.emit()"
                />
                <figcaption
                  class="flex flex-wrap items-baseline gap-x-2 text-body-sm text-ink-muted"
                >
                  <span class="text-label-lg text-ink tabular-nums">
                    @if (weightOn(photo.takenOn); as weight) {
                      {{ weight | number: '1.0-1' }} kg
                    } @else {
                      Sem peso no dia
                    }
                  </span>
                  @if (side.key === 'after' && gapDays() !== null) {
                    <span class="tabular-nums">{{ gapLabel() }}</span>
                  }
                </figcaption>
              }
            </figure>
          }
        </div>
      </div>
    </app-modal>
  `,
})
export class ProgressPhotoCompareModal {
  readonly days = input.required<readonly ProgressPhotoDay[]>();
  /** Registros de peso do paciente (GET), para mostrar o peso de cada data. */
  readonly weightRecordsPath = input.required<string>();
  /** A URL assinada expirou: quem usa recarrega a lista. */
  readonly imageFailed = output();
  readonly closed = output();

  protected readonly angles = PHOTO_ANGLES;
  protected readonly labels = PHOTO_ANGLE_LABELS;
  protected readonly sides = [
    { key: 'before', label: 'Antes' },
    { key: 'after', label: 'Depois' },
  ] as const;

  /** O primeiro ângulo com pelo menos duas datas. */
  protected readonly angle = linkedSignal<PhotoAngle>(
    () => PHOTO_ANGLES.find((angle) => this.datesFor(angle).length >= 2) ?? 'Front',
  );
  /** Datas com foto no ângulo escolhido, da mais recente para a mais antiga. */
  protected readonly dates = computed(() => this.datesFor(this.angle()));
  protected readonly before = linkedSignal(() => this.dates().at(-1) ?? '');
  protected readonly after = linkedSignal(() => this.dates()[0] ?? '');

  protected readonly gapDays = computed(() => {
    if (!this.before() || !this.after()) return null;
    const gap = parseIsoDate(this.after()).getTime() - parseIsoDate(this.before()).getTime();
    return Math.round(gap / DAY_MS);
  });
  protected readonly gapLabel = computed(() => {
    const days = this.gapDays() ?? 0;
    const sign = days >= 0 ? '+' : '−';
    const count = Math.abs(days);
    return `${sign}${count} ${count === 1 ? 'dia' : 'dias'}`;
  });

  private readonly oldest = computed(() => this.days().at(-1)?.takenOn ?? null);
  protected readonly weights = httpResource<PagedResponse<WeightRecord>>(() => {
    const from = this.oldest();
    return from
      ? { url: apiUrl(this.weightRecordsPath()), params: { page: 1, pageSize: 100, from } }
      : undefined;
  });

  datesFor(angle: PhotoAngle): string[] {
    return this.days()
      .filter((day) => day.photos.some((photo) => photo.angle === angle))
      .map((day) => day.takenOn);
  }

  protected photoFor(side: 'before' | 'after'): ProgressPhoto | null {
    const date = side === 'before' ? this.before() : this.after();
    return date ? photoAt(this.days(), date, this.angle()) : null;
  }

  protected weightOn(date: string): number | null {
    if (!this.weights.hasValue()) return null;
    return (
      this.weights.value().items.find((record) => record.recordedOn === date)?.weightKg ?? null
    );
  }

  protected pick(side: 'before' | 'after', event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    (side === 'before' ? this.before : this.after).set(value);
  }
}

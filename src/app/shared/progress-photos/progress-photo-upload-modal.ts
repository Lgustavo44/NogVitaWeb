import {
  Component,
  booleanAttribute,
  computed,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormField, FormRoot, form, required, validate } from '@angular/forms/signals';
import { LucideImagePlus, LucideUpload } from '@lucide/angular';
import { ImageCropper } from '../photos/image-cropper';
import {
  IMAGE_ACCEPT,
  IMAGE_SOURCE_MAX_BYTES,
  imageFileError,
  takeFile,
} from '../photos/image-file';
import { Alert } from '../ui/alert/alert';
import { Button } from '../ui/button/button';
import { Field } from '../ui/field/field';
import { FieldInput } from '../ui/field/field-input';
import { Modal } from '../ui/modal/modal';
import { daysAgoIsoDate, localIsoDate } from '../util/dates';
import {
  PHOTO_ANGLES,
  PHOTO_ANGLE_LABELS,
  PROGRESS_PHOTO_MAX_DAYS_BACK,
  PhotoAngle,
  ProgressPhotoDay,
  UploadProgressPhoto,
  photoAt,
} from './progress-photos.models';

/**
 * Enviar uma foto de evolução: data, ângulo e arquivo (clicar ou arrastar), com o
 * enquadramento ajustado no recorte 3:4.
 * Avisa quando a foto vai substituir outra do mesmo dia e ângulo. Quem usa faz o envio.
 */
@Component({
  selector: 'app-progress-photo-upload-modal',
  imports: [
    Alert,
    ImageCropper,
    Button,
    Field,
    FieldInput,
    FormField,
    FormRoot,
    LucideImagePlus,
    LucideUpload,
    Modal,
  ],
  template: `
    <app-modal
      heading="Adicionar foto de evolução"
      subtitle="Uma foto por ângulo em cada dia. A data pode ser de hoje até um ano atrás."
      [busy]="busy()"
      (closed)="closed.emit()"
    >
      <form [formRoot]="photoForm" id="form-foto-evolucao" class="flex flex-col gap-5">
        <div class="grid gap-4 sm:grid-cols-2">
          <app-field label="Data da foto">
            <input
              appInput
              [formField]="photoForm.takenOn"
              type="date"
              [min]="minDate"
              [max]="maxDate"
            />
          </app-field>
          <div class="flex flex-col gap-1.5">
            <span id="angulo-rotulo" class="text-label-md text-ink">Ângulo</span>
            <div
              class="flex gap-1 rounded-container bg-surface-muted p-1"
              role="group"
              aria-labelledby="angulo-rotulo"
            >
              @for (angle of angles; track angle) {
                <button
                  type="button"
                  class="min-h-10 flex-1 cursor-pointer rounded-control px-2 text-label-lg text-ink-muted transition-colors hover:text-ink aria-pressed:bg-surface aria-pressed:font-semibold aria-pressed:text-ink aria-pressed:shadow-1"
                  [attr.aria-pressed]="model().angle === angle"
                  (click)="setAngle(angle)"
                >
                  {{ labels[angle] }}
                </button>
              }
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <input
            id="arquivo-evolucao"
            type="file"
            class="peer sr-only"
            [accept]="accept"
            aria-describedby="arquivo-evolucao-dica"
            (change)="choose(takeFile($event))"
          />
          @if (file(); as chosen) {
            <!-- Depois de escolher: ajustar o enquadramento 3:4 (o mesmo das miniaturas) -->
            <app-image-cropper
              [file]="chosen"
              [aspect]="3 / 4"
              [outputWidth]="1200"
              [maxWidth]="260"
              label="Ajuste da foto de evolução"
            />
            <label
              for="arquivo-evolucao"
              class="mx-auto inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-control px-3 text-label-lg text-link peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus hover:bg-soft/25"
            >
              <svg lucideImagePlus class="size-5" aria-hidden="true"></svg>
              Escolher outra foto
            </label>
          } @else {
            <label
              for="arquivo-evolucao"
              class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-container border-2 border-dashed p-5 text-center transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus hover:border-line"
              [class.border-hairline]="!dragging()"
              [class.border-primary]="dragging()"
              [class.bg-soft/20]="dragging()"
              (dragover)="onDragOver($event)"
              (dragleave)="dragging.set(false)"
              (drop)="onDrop($event)"
            >
              <span
                class="flex size-12 items-center justify-center rounded-full bg-soft/40 text-link"
                aria-hidden="true"
              >
                <svg lucideImagePlus class="size-6"></svg>
              </span>
              <span class="text-label-lg text-ink">Escolha uma foto ou arraste até aqui</span>
              <span id="arquivo-evolucao-dica" class="text-body-sm text-ink-muted">
                JPEG, PNG ou WebP. Corpo inteiro, com boa luz e fundo neutro. Depois você ajusta o
                enquadramento.
              </span>
            </label>
          }
          @if (fileError(); as message) {
            <p class="text-body-sm text-danger-ink" role="alert">{{ message }}</p>
          }
        </div>

        @if (replacing()) {
          <app-alert tone="warning">
            Já existe uma foto de {{ labels[model().angle].toLowerCase() }} nesta data. Esta foto
            vai substituir a anterior.
          </app-alert>
        }
        @if (error(); as message) {
          <app-alert tone="danger">{{ message }}</app-alert>
        }
      </form>
      <ng-container modalActions>
        <button appButton variant="soft" type="button" [disabled]="busy()" (click)="closed.emit()">
          Cancelar
        </button>
        <button appButton type="submit" form="form-foto-evolucao" [loading]="busy()">
          <svg lucideUpload class="size-5"></svg>
          {{ replacing() ? 'Substituir foto' : 'Enviar foto' }}
        </button>
      </ng-container>
    </app-modal>
  `,
})
export class ProgressPhotoUploadModal {
  /** Para avisar a substituição. */
  readonly days = input<readonly ProgressPhotoDay[]>([]);
  readonly initialDate = input<string | null>(null);
  readonly initialAngle = input<PhotoAngle>('Front');
  readonly busy = input(false, { transform: booleanAttribute });
  readonly error = input<string | null>(null);
  readonly submitted = output<UploadProgressPhoto>();
  readonly closed = output();

  protected readonly accept = IMAGE_ACCEPT;
  protected readonly takeFile = takeFile;
  protected readonly angles = PHOTO_ANGLES;
  protected readonly labels = PHOTO_ANGLE_LABELS;
  protected readonly maxDate = localIsoDate();
  protected readonly minDate = daysAgoIsoDate(PROGRESS_PHOTO_MAX_DAYS_BACK);

  /** Começa na data e no ângulo da vaga clicada (ou hoje, de frente). */
  protected readonly model = linkedSignal(() => ({
    takenOn: this.initialDate() ?? this.maxDate,
    angle: this.initialAngle(),
  }));
  protected readonly file = signal<File | null>(null);
  protected readonly fileError = signal<string | null>(null);
  protected readonly dragging = signal(false);
  protected readonly replacing = computed(
    () => !!photoAt(this.days(), this.model().takenOn, this.model().angle),
  );

  protected readonly photoForm = form(
    this.model,
    (path) => {
      required(path.takenOn, { message: 'Informe a data da foto.' });
      validate(path.takenOn, ({ value }) => {
        const date = value();
        if (!date) return undefined;
        if (date > this.maxDate) return { kind: 'future', message: 'A data não pode ser futura.' };
        return date < this.minDate
          ? { kind: 'too-old', message: 'A data pode ser de até um ano atrás.' }
          : undefined;
      });
    },
    { name: 'progress-photo', submission: { action: async () => this.submit() } },
  );

  private readonly cropper = viewChild(ImageCropper);

  protected setAngle(angle: PhotoAngle): void {
    this.model.update((current) => ({ ...current, angle }));
  }

  protected choose(file: File | null): void {
    if (!file) return;
    const error = imageFileError(file, IMAGE_SOURCE_MAX_BYTES);
    this.fileError.set(error);
    if (error) return;
    this.file.set(file);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.choose(event.dataTransfer?.files?.[0] ?? null);
  }

  /** Envia o recorte (JPEG), não o arquivo original. */
  private async submit(): Promise<undefined> {
    const cropper = this.cropper();
    if (!this.file() || !cropper) {
      this.fileError.set('Escolha a foto que vai enviar.');
      return undefined;
    }
    try {
      const file = await cropper.export();
      this.submitted.emit({ file, ...this.model() });
    } catch (error) {
      this.fileError.set(error instanceof Error ? error.message : 'Escolha outra foto.');
    }
    return undefined;
  }
}

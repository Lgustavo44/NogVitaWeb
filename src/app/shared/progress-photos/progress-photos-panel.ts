import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import {
  LucideCamera,
  LucideColumns2,
  LucideImagePlus,
  LucidePlus,
  LucideShieldCheck,
  LucideTrash2,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../core/http/api-error';
import { apiUrl } from '../../core/http/api-url';
import { Button } from '../ui/button/button';
import { ConfirmDialog } from '../ui/confirm-dialog/confirm-dialog';
import { LoadError } from '../ui/load-error/load-error';
import { Modal } from '../ui/modal/modal';
import { Toaster } from '../ui/toast/toaster';
import { ProgressPhotoCompareModal } from './progress-photo-compare-modal';
import { ProgressPhotoUploadModal } from './progress-photo-upload-modal';
import { ProgressPhotosApi } from './progress-photos-api';
import {
  PHOTO_ANGLES,
  PHOTO_ANGLE_LABELS,
  PROGRESS_PHOTOS_MAX,
  PhotoAngle,
  ProgressPhoto,
  ProgressPhotoConsent,
  ProgressPhotoDay,
  ProgressPhotosPerspective,
  UploadProgressPhoto,
} from './progress-photos.models';

/** URLs assinadas expiram: depois de uma falha, pede URLs novas no máximo uma vez por minuto. */
const REFRESH_COOLDOWN_MS = 60_000;

/**
 * Fotos de evolução, igual para o paciente e o nutricionista (que só vê).
 * O paciente precisa aceitar o termo antes de ver e enviar; revogar apaga todas as fotos.
 */
@Component({
  selector: 'app-progress-photos-panel',
  imports: [
    Button,
    ConfirmDialog,
    DatePipe,
    LoadError,
    LucideCamera,
    LucideColumns2,
    LucideImagePlus,
    LucidePlus,
    LucideShieldCheck,
    LucideTrash2,
    Modal,
    ProgressPhotoCompareModal,
    ProgressPhotoUploadModal,
  ],
  host: { class: 'flex flex-col gap-4' },
  templateUrl: './progress-photos-panel.html',
})
export class ProgressPhotosPanel {
  private readonly api = inject(ProgressPhotosApi);
  private readonly toaster = inject(Toaster);

  /** Lista (GET). Ex.: '/patients/me/progress-photos'. */
  readonly photosPath = input.required<string>();
  readonly perspective = input.required<ProgressPhotosPerspective>();
  /** Registros de peso do mesmo paciente (GET), para a comparação. */
  readonly weightRecordsPath = input.required<string>();

  protected readonly angles = PHOTO_ANGLES;
  protected readonly labels = PHOTO_ANGLE_LABELS;
  protected readonly max = PROGRESS_PHOTOS_MAX;
  protected readonly isPatient = computed(() => this.perspective() === 'patient');

  /** Só o paciente tem termo; para o nutricionista a API já exige o acompanhamento ativo. */
  protected readonly consent = httpResource<ProgressPhotoConsent>(() =>
    this.isPatient() ? apiUrl(`${this.photosPath()}/consent`) : undefined,
  );
  protected readonly needsConsent = computed(
    () => this.isPatient() && this.consent.hasValue() && !this.consent.value().accepted,
  );
  private readonly canList = computed(
    () => !this.isPatient() || (this.consent.hasValue() && this.consent.value().accepted),
  );
  protected readonly photos = httpResource<ProgressPhotoDay[]>(() =>
    this.canList() ? apiUrl(this.photosPath()) : undefined,
  );
  protected readonly days = computed(() => (this.photos.hasValue() ? this.photos.value() : []));
  protected readonly total = computed(() =>
    this.days().reduce((count, day) => count + day.photos.length, 0),
  );
  protected readonly full = computed(() => this.total() >= PROGRESS_PHOTOS_MAX);
  /** Comparar faz sentido com duas datas no mesmo ângulo. */
  protected readonly canCompare = computed(() =>
    PHOTO_ANGLES.some(
      (angle) => this.days().filter((day) => day.photos.some((p) => p.angle === angle)).length >= 2,
    ),
  );

  protected readonly accepting = signal(false);
  protected readonly consentError = signal<string | null>(null);

  protected readonly uploadTarget = signal<{ date: string | null; angle: PhotoAngle } | null>(null);
  protected readonly uploading = signal(false);
  protected readonly uploadError = signal<string | null>(null);

  protected readonly viewing = signal<ProgressPhoto | null>(null);
  protected readonly deleteTarget = signal<ProgressPhoto | null>(null);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  protected readonly revoking = signal(false);
  protected readonly confirmingRevoke = signal(false);
  protected readonly revokeError = signal<string | null>(null);

  protected readonly comparing = signal(false);
  private lastRefresh = 0;

  protected photoOf(day: ProgressPhotoDay, angle: PhotoAngle): ProgressPhoto | null {
    return day.photos.find((photo) => photo.angle === angle) ?? null;
  }

  /** A imagem não carregou (URL assinada vencida): pede a lista de novo, com folga. */
  protected refreshUrls(): void {
    const now = Date.now();
    if (now - this.lastRefresh < REFRESH_COOLDOWN_MS) return;
    this.lastRefresh = now;
    this.photos.reload();
  }

  protected async acceptConsent(): Promise<void> {
    if (!this.consent.hasValue()) return;
    this.accepting.set(true);
    this.consentError.set(null);
    try {
      await firstValueFrom(this.api.acceptConsent(this.consent.value().version));
      this.consent.reload();
    } catch (error) {
      this.consentError.set(toApiError(error).message);
      // 422: o termo mudou de versão; mostra o texto novo.
      this.consent.reload();
    } finally {
      this.accepting.set(false);
    }
  }

  protected openUpload(date: string | null = null, angle: PhotoAngle = 'Front'): void {
    this.uploadError.set(null);
    this.uploadTarget.set({ date, angle });
  }

  protected closeUpload(): void {
    if (!this.uploading()) this.uploadTarget.set(null);
  }

  protected async upload(photo: UploadProgressPhoto): Promise<void> {
    this.uploading.set(true);
    this.uploadError.set(null);
    try {
      await firstValueFrom(this.api.upload(photo));
      this.uploadTarget.set(null);
      this.toaster.show('Foto de evolução enviada.');
      this.photos.reload();
    } catch (error) {
      const apiError = toApiError(error);
      this.uploadError.set(apiError.message);
      if (apiError.status === 422) this.consent.reload();
    } finally {
      this.uploading.set(false);
    }
  }

  protected askDelete(photo: ProgressPhoto): void {
    this.deleteError.set(null);
    this.viewing.set(null);
    this.deleteTarget.set(photo);
  }

  protected closeDelete(): void {
    if (!this.deleting()) this.deleteTarget.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const photo = this.deleteTarget();
    if (!photo) return;
    this.deleting.set(true);
    this.deleteError.set(null);
    try {
      await firstValueFrom(this.api.delete(photo.id));
      this.deleteTarget.set(null);
      this.toaster.show('Foto apagada.');
      this.photos.reload();
    } catch (error) {
      this.deleteError.set(toApiError(error).message);
    } finally {
      this.deleting.set(false);
    }
  }

  protected openRevoke(): void {
    this.revokeError.set(null);
    this.confirmingRevoke.set(true);
  }

  protected closeRevoke(): void {
    if (!this.revoking()) this.confirmingRevoke.set(false);
  }

  protected async confirmRevoke(): Promise<void> {
    this.revoking.set(true);
    this.revokeError.set(null);
    try {
      await firstValueFrom(this.api.revokeConsent());
      this.confirmingRevoke.set(false);
      this.toaster.show('Consentimento retirado. Suas fotos de evolução foram apagadas.', 'info');
      this.consent.reload();
    } catch (error) {
      this.revokeError.set(toApiError(error).message);
    } finally {
      this.revoking.set(false);
    }
  }
}

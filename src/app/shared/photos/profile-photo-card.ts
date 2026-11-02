import { Component, inject, input, output, signal, viewChild } from '@angular/core';
import { LucideCamera, LucideCheck, LucideTrash2 } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../core/http/api-error';
import { Alert } from '../ui/alert/alert';
import { Avatar } from '../ui/avatar/avatar';
import { Button } from '../ui/button/button';
import { ConfirmDialog } from '../ui/confirm-dialog/confirm-dialog';
import { Modal } from '../ui/modal/modal';
import { Toaster } from '../ui/toast/toaster';
import { ImageCropper } from './image-cropper';
import { IMAGE_ACCEPT, IMAGE_SOURCE_MAX_BYTES, imageFileError, takeFile } from './image-file';
import { PhotosApi } from './photos-api';

/**
 * Enviar, trocar e remover a foto de perfil. Ao escolher, a pessoa ajusta o recorte redondo
 * (posição, zoom, giro) e só então envia. Quem usa recarrega o perfil no `changed`
 * (o cabeçalho e as listas da área leem a foto de lá).
 */
@Component({
  selector: 'app-profile-photo-card',
  imports: [
    Alert,
    Avatar,
    Button,
    ConfirmDialog,
    ImageCropper,
    LucideCamera,
    LucideCheck,
    LucideTrash2,
    Modal,
  ],
  host: { class: 'block' },
  template: `
    <section
      class="flex flex-col gap-4 rounded-container bg-surface p-5 shadow-1"
      aria-labelledby="foto-perfil-titulo"
    >
      <h2 id="foto-perfil-titulo" class="text-title-md text-ink">Foto de perfil</h2>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        <app-avatar [name]="name()" [photoUrl]="photoUrl()" size="xl" />
        <div class="flex min-w-0 flex-col gap-3">
          <p class="text-body-md text-ink-muted">{{ hint() }}</p>
          <p class="text-body-sm text-ink-muted">
            JPEG, PNG ou WebP. Depois de escolher, você ajusta o enquadramento.
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              appButton
              variant="soft"
              type="button"
              [disabled]="removing()"
              (click)="picker.click()"
            >
              <svg lucideCamera class="size-5"></svg>
              {{ photoUrl() ? 'Trocar foto' : 'Enviar foto' }}
            </button>
            @if (photoUrl()) {
              <button appButton variant="ghost" type="button" (click)="confirming.set(true)">
                <svg lucideTrash2 class="size-5"></svg>
                Remover
              </button>
            }
          </div>
          @if (fileError(); as error) {
            <p class="text-body-sm text-danger-ink" role="alert">{{ error }}</p>
          }
        </div>
      </div>
      <input
        #picker
        type="file"
        class="hidden"
        [accept]="accept"
        tabindex="-1"
        aria-hidden="true"
        (change)="choose($event)"
      />
    </section>

    @if (pending(); as file) {
      <app-modal
        heading="Ajustar foto de perfil"
        subtitle="O que fica dentro do círculo é o que aparece no seu avatar."
        [busy]="uploading()"
        (closed)="closeCropper()"
      >
        <app-image-cropper
          [file]="file"
          [aspect]="1"
          round
          [outputWidth]="1024"
          label="Ajuste da foto de perfil"
        />
        @if (uploadError(); as message) {
          <app-alert tone="danger">{{ message }}</app-alert>
        }
        <ng-container modalActions>
          <button
            appButton
            variant="soft"
            type="button"
            [disabled]="uploading()"
            (click)="closeCropper()"
          >
            Cancelar
          </button>
          <button appButton type="button" [loading]="uploading()" (click)="upload()">
            <svg lucideCheck class="size-5"></svg>
            Salvar foto
          </button>
        </ng-container>
      </app-modal>
    }

    @if (confirming()) {
      <app-confirm-dialog
        heading="Remover foto de perfil?"
        confirmLabel="Remover foto"
        tone="danger"
        [busy]="removing()"
        [error]="removeError()"
        (confirmed)="remove()"
        (closed)="closeConfirm()"
      >
        <p>No lugar da foto, aparecem as suas iniciais.</p>
      </app-confirm-dialog>
    }
  `,
})
export class ProfilePhotoCard {
  private readonly api = inject(PhotosApi);
  private readonly toaster = inject(Toaster);

  readonly name = input.required<string>();
  readonly photoUrl = input<string | null | undefined>(null);
  /** Rota da área: '/patients/me/photo' ou '/nutritionists/me/photo'. */
  readonly path = input.required<string>();
  /** Onde a foto aparece (para quem está enviando entender o alcance). */
  readonly hint = input.required<string>();
  readonly changed = output();

  protected readonly accept = IMAGE_ACCEPT;
  /** A foto escolhida, esperando o ajuste do recorte. */
  protected readonly pending = signal<File | null>(null);
  protected readonly uploading = signal(false);
  protected readonly removing = signal(false);
  protected readonly confirming = signal(false);
  protected readonly fileError = signal<string | null>(null);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly removeError = signal<string | null>(null);
  private readonly cropper = viewChild(ImageCropper);

  protected choose(event: Event): void {
    const file = takeFile(event);
    if (!file) return;
    const error = imageFileError(file, IMAGE_SOURCE_MAX_BYTES);
    this.fileError.set(error);
    if (error) return;
    this.uploadError.set(null);
    this.pending.set(file);
  }

  protected closeCropper(): void {
    if (!this.uploading()) this.pending.set(null);
  }

  protected async upload(): Promise<void> {
    const cropper = this.cropper();
    if (!cropper) return;
    this.uploading.set(true);
    this.uploadError.set(null);
    try {
      const file = await cropper.export();
      await firstValueFrom(this.api.uploadProfilePhoto(this.path(), file));
      this.pending.set(null);
      this.toaster.show('Foto de perfil atualizada.');
      this.changed.emit();
    } catch (failure) {
      this.uploadError.set(
        failure instanceof Error ? failure.message : toApiError(failure).message,
      );
    } finally {
      this.uploading.set(false);
    }
  }

  protected async remove(): Promise<void> {
    this.removing.set(true);
    this.removeError.set(null);
    try {
      await firstValueFrom(this.api.deleteProfilePhoto(this.path()));
      this.confirming.set(false);
      this.toaster.show('Foto de perfil removida.');
      this.changed.emit();
    } catch (failure) {
      this.removeError.set(toApiError(failure).message);
    } finally {
      this.removing.set(false);
    }
  }

  protected closeConfirm(): void {
    if (!this.removing()) {
      this.confirming.set(false);
      this.removeError.set(null);
    }
  }
}

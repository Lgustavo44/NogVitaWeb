import { HttpClient } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { LucideFileDown } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../core/http/api-error';
import { apiUrl } from '../../core/http/api-url';
import { Button } from '../ui/button/button';
import { Toaster } from '../ui/toast/toaster';
import { saveBlob, slugify } from '../util/download';

/**
 * Baixa a anamnese respondida em PDF (com o CRN e o código verificador), para imprimir, guardar ou assinar.
 * A rota exige o token, então o arquivo vem pelo HttpClient.
 */
@Component({
  selector: 'app-anamnesis-pdf-button',
  imports: [Button, LucideFileDown],
  template: `
    <button
      appButton
      variant="outline"
      type="button"
      [loading]="downloading()"
      (click)="download()"
    >
      <svg lucideFileDown class="size-5"></svg>
      Baixar PDF
    </button>
  `,
})
export class AnamnesisPdfButton {
  private readonly http = inject(HttpClient);
  private readonly toaster = inject(Toaster);

  /** Ex.: '/nutritionists/me/anamneses/{id}/pdf' ou '/patients/me/anamneses/{id}/pdf'. */
  readonly pdfPath = input.required<string>();
  readonly title = input.required<string>();

  protected readonly downloading = signal(false);

  protected async download(): Promise<void> {
    if (this.downloading()) {
      return;
    }
    this.downloading.set(true);
    try {
      const blob = await firstValueFrom(
        this.http.get(apiUrl(this.pdfPath()), { responseType: 'blob' }),
      );
      saveBlob(blob, `${slugify(this.title(), 'anamnese')}.pdf`);
    } catch (error) {
      this.toaster.show(toApiError(error).message, 'danger');
    } finally {
      this.downloading.set(false);
    }
  }
}

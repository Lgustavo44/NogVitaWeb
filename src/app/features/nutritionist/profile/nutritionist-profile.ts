import { Component, computed, inject, linkedSignal } from '@angular/core';
import { FormField, FormRoot, TreeValidationResult, form, maxLength } from '@angular/forms/signals';
import {
  LucideBadgeCheck,
  LucideEye,
  LucideLock,
  LucidePenLine,
  LucideSave,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError, toFieldErrors } from '../../../core/http/api-error';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { FieldInput } from '../../../shared/ui/field/field-input';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { NutritionistApi } from '../nutritionist-api';
import { NutritionistProfileStore } from '../nutritionist-profile-store';

const BIO_MAX = 500;

@Component({
  selector: 'app-nutritionist-profile',
  imports: [
    Alert,
    Button,
    Field,
    FieldInput,
    FormField,
    FormRoot,
    LoadError,
    LucideBadgeCheck,
    LucideEye,
    LucideLock,
    LucidePenLine,
    LucideSave,
    PageHeader,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './nutritionist-profile.html',
})
export class NutritionistProfilePage {
  private readonly api = inject(NutritionistApi);
  private readonly toaster = inject(Toaster);
  protected readonly profile = inject(NutritionistProfileStore).profile;
  protected readonly bioMax = BIO_MAX;

  /** Volta à bio salva sempre que o perfil (re)carrega. */
  protected readonly model = linkedSignal(() => ({
    bio: this.profile.hasValue() ? (this.profile.value().bio ?? '') : '',
  }));
  protected readonly profileForm = form(
    this.model,
    (path) => {
      maxLength(path.bio, BIO_MAX, {
        message: `A apresentação pode ter até ${BIO_MAX} caracteres.`,
      });
    },
    { name: 'nutritionist-profile', submission: { action: () => this.save() } },
  );

  protected readonly bioLength = computed(() => this.model().bio.length);
  protected readonly changed = computed(
    () => this.profile.hasValue() && this.model().bio !== (this.profile.value().bio ?? ''),
  );
  protected readonly crn = computed(() =>
    this.profile.hasValue()
      ? `CRN-${this.profile.value().crnRegion} ${this.profile.value().crnNumber}`
      : '',
  );
  protected readonly initials = computed(() => {
    const parts = this.profile.hasValue() ? this.profile.value().name.split(/\s+/) : [];
    return (
      (parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')
    ).toUpperCase();
  });

  protected discard(): void {
    this.model.set({ bio: this.profile.hasValue() ? (this.profile.value().bio ?? '') : '' });
    this.profileForm().reset();
  }

  private async save(): Promise<TreeValidationResult> {
    const bio = this.model().bio.trim();
    try {
      await firstValueFrom(this.api.updateBio(bio || null));
      this.toaster.show(bio ? 'Apresentação salva.' : 'Apresentação removida.');
      this.profile.reload();
      this.profileForm().reset();
      return undefined;
    } catch (error) {
      const apiError = toApiError(error);
      this.toaster.show(apiError.message, 'danger');
      return toFieldErrors(apiError, { bio: this.profileForm.bio });
    }
  }
}

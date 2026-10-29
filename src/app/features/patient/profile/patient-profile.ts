import { DatePipe } from '@angular/common';
import { Component, computed, inject, linkedSignal } from '@angular/core';
import {
  FormField,
  FormRoot,
  TreeValidationResult,
  form,
  min,
  required,
  validate,
} from '@angular/forms/signals';
import {
  LucideClock,
  LucideIdCard,
  LucideLock,
  LucideRuler,
  LucideSave,
  LucideTarget,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { toApiError, toFieldErrors } from '../../../core/http/api-error';
import {
  BIOLOGICAL_SEX_LABELS,
  BiologicalSex,
  GOAL_LABELS,
  Goal,
} from '../../../shared/domain/patient-enums';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { FieldInput } from '../../../shared/ui/field/field-input';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { PatientApi } from '../patient-api';
import { PatientProfileStore } from '../patient-profile-store';
import { PatientProfile, UpdatePatientProfileRequest } from '../patient.models';

/** O formulário trabalha com texto nos horários ('' = não informado) e altura vazia como null. */
interface ProfileForm {
  birthDate: string;
  heightInCm: number | null;
  biologicalSex: BiologicalSex;
  goal: Goal;
  wakeUpTime: string;
  bedTime: string;
  trainingTime: string;
}

const GOAL_DESCRIPTIONS: Record<Goal, string> = {
  WeightLoss: 'Perder peso com saúde, sem abrir mão da massa magra.',
  Maintenance: 'Manter o peso e consolidar bons hábitos alimentares.',
  MuscleGain: 'Ganhar massa muscular com alimentação adequada ao treino.',
};

@Component({
  selector: 'app-patient-profile',
  imports: [
    Alert,
    Button,
    DatePipe,
    Field,
    FieldInput,
    FormField,
    FormRoot,
    LoadError,
    LucideClock,
    LucideIdCard,
    LucideLock,
    LucideRuler,
    LucideSave,
    LucideTarget,
    PageHeader,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './patient-profile.html',
})
export class PatientProfilePage {
  private readonly api = inject(PatientApi);
  private readonly toaster = inject(Toaster);
  protected readonly profile = inject(PatientProfileStore).profile;

  protected readonly goals = (Object.keys(GOAL_LABELS) as Goal[]).map((value) => ({
    value,
    label: GOAL_LABELS[value],
    description: GOAL_DESCRIPTIONS[value],
  }));
  protected readonly sexes = (Object.keys(BIOLOGICAL_SEX_LABELS) as BiologicalSex[]).map(
    (value) => ({ value, label: BIOLOGICAL_SEX_LABELS[value] }),
  );
  protected readonly maxBirthDate = adultCutoff();

  /** Volta aos valores salvos sempre que o perfil (re)carrega. */
  protected readonly model = linkedSignal<ProfileForm>(() =>
    this.profile.hasValue() ? toForm(this.profile.value()) : EMPTY_FORM,
  );
  protected readonly profileForm = form(
    this.model,
    (path) => {
      required(path.birthDate, { message: 'Informe sua data de nascimento.' });
      validate(path.birthDate, ({ value }) => {
        const message = value() ? birthDateError(value()) : undefined;
        return message ? { kind: 'birth-date', message } : undefined;
      });
      required(path.heightInCm, { message: 'Informe sua altura.' });
      min(path.heightInCm, 1, { message: 'A altura deve ser maior que zero.' });
      validate(path.heightInCm, ({ value }) => {
        const height = value();
        return height === null || (Number.isInteger(height) && height <= 999)
          ? undefined
          : { kind: 'height', message: 'Informe a altura em centímetros, sem vírgula.' };
      });
      validate(path.bedTime, ({ value, valueOf }) =>
        value() && value() === valueOf(path.wakeUpTime)
          ? { kind: 'same-time', message: 'O horário de dormir não pode ser igual ao de acordar.' }
          : undefined,
      );
    },
    { name: 'patient-profile', submission: { action: () => this.save() } },
  );

  /** Há algo diferente do que está salvo? Habilita "Salvar" e "Descartar". */
  protected readonly changed = computed(
    () =>
      this.profile.hasValue() &&
      JSON.stringify(this.model()) !== JSON.stringify(toForm(this.profile.value())),
  );

  protected setGoal(goal: Goal): void {
    this.model.update((current) => ({ ...current, goal }));
  }

  protected setSex(biologicalSex: BiologicalSex): void {
    this.model.update((current) => ({ ...current, biologicalSex }));
  }

  protected discard(): void {
    if (this.profile.hasValue()) {
      this.model.set(toForm(this.profile.value()));
      this.profileForm().reset();
    }
  }

  private async save(): Promise<TreeValidationResult> {
    try {
      await firstValueFrom(this.api.updateProfile(toRequest(this.model())));
      this.toaster.show('Perfil salvo.');
      this.profile.reload();
      this.profileForm().reset();
      return undefined;
    } catch (error) {
      const apiError = toApiError(error);
      this.toaster.show(apiError.message, 'danger');
      const fields = this.profileForm;
      return toFieldErrors(apiError, {
        birthDate: fields.birthDate,
        heightInCm: fields.heightInCm,
        biologicalSex: fields.biologicalSex,
        goal: fields.goal,
        wakeUpTime: fields.wakeUpTime,
        bedTime: fields.bedTime,
        trainingTime: fields.trainingTime,
      });
    }
  }
}

const EMPTY_FORM: ProfileForm = {
  birthDate: '',
  heightInCm: null,
  biologicalSex: 'Female',
  goal: 'Maintenance',
  wakeUpTime: '',
  bedTime: '',
  trainingTime: '',
};

/** A API devolve os horários com segundos ("07:00:00"); o input de hora usa "07:00". */
function toForm(profile: PatientProfile): ProfileForm {
  return {
    birthDate: profile.birthDate,
    heightInCm: profile.heightInCm,
    biologicalSex: profile.biologicalSex,
    goal: profile.goal,
    wakeUpTime: profile.wakeUpTime?.slice(0, 5) ?? '',
    bedTime: profile.bedTime?.slice(0, 5) ?? '',
    trainingTime: profile.trainingTime?.slice(0, 5) ?? '',
  };
}

function toRequest(model: ProfileForm): UpdatePatientProfileRequest {
  return {
    birthDate: model.birthDate,
    // A validação já garantiu a altura; o "?? 0" só satisfaz o tipo.
    heightInCm: model.heightInCm ?? 0,
    biologicalSex: model.biologicalSex,
    goal: model.goal,
    wakeUpTime: model.wakeUpTime || null,
    bedTime: model.bedTime || null,
    trainingTime: model.trainingTime || null,
  };
}

/** Data máxima para ter 18 anos hoje, no formato do input de data (AAAA-MM-DD). */
function adultCutoff(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().slice(0, 10);
}

function birthDateError(isoDate: string): string | undefined {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return 'Informe uma data válida.';
  }
  if (date > new Date()) {
    return 'A data de nascimento não pode ser futura.';
  }
  return isoDate > adultCutoff() ? 'Você precisa ter pelo menos 18 anos.' : undefined;
}

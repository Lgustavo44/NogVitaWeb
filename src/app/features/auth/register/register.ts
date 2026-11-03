import { httpResource } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import {
  FieldTree,
  FormField,
  FormRoot,
  TreeValidationResult,
  email,
  form,
  min,
  maxLength,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideIdCard,
  LucideCalendarDays,
  LucideDumbbell,
  LucideEye,
  LucideEyeOff,
  LucideGoal,
  LucideLock,
  LucideMail,
  LucideRefreshCw,
  LucideRuler,
  LucideScale,
  LucideUserRound,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../../core/auth/auth-api';
import { PatientRegistrationRequest } from '../../../core/auth/auth.models';

import { BiologicalSex, Goal as PatientGoal } from '../../../shared/domain/patient-enums';
import { ApiError, toApiError, toFieldErrors } from '../../../core/http/api-error';
import { apiUrl } from '../../../core/http/api-url';
import {
  HEALTH_DATA_CONSENT_TERM_URL,
  HealthDataConsentTerm,
} from '../../../shared/health-data-consent/health-data-consent';
import { HealthDataConsentChecks } from '../../../shared/health-data-consent/health-data-consent-checks';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { LoadError } from '../../../shared/ui/load-error/load-error';
import { FieldInput } from '../../../shared/ui/field/field-input';
import { Logo } from '../../../shared/ui/logo/logo';
import { formatCpf, isValidCpf } from '../../../shared/util/cpf';

/** O formulário aceita altura vazia (null) enquanto a pessoa não preenche. A versão do termo vem do servidor. */
type RegisterModel = Omit<PatientRegistrationRequest, 'heightInCm' | 'healthDataConsentVersion'> & {
  heightInCm: number | null;
};

/** Espera entre reenvios do link de confirmação. */
const RESEND_COOLDOWN_SECONDS = 60;

@Component({
  selector: 'app-register',
  imports: [
    Alert,
    Button,
    Field,
    FieldInput,
    FormField,
    FormRoot,
    HealthDataConsentChecks,
    LoadError,
    Logo,
    LucideArrowLeft,
    LucideArrowRight,
    LucideIdCard,
    LucideCalendarDays,
    LucideDumbbell,
    LucideEye,
    LucideEyeOff,
    LucideGoal,
    LucideLock,
    LucideMail,
    LucideRefreshCw,
    LucideRuler,
    LucideScale,
    LucideUserRound,
    RouterLink,
  ],
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './register.html',
})
export class Register {
  private readonly authApi = inject(AuthApi);
  private cooldownTimer: ReturnType<typeof setInterval> | undefined;

  protected readonly resendState = signal<'idle' | 'sending' | 'sent'>('idle');
  protected readonly resendCooldown = signal(0);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.cooldownTimer));
  }

  /** Reenvia o link (a API responde sempre 202) e espera um minuto para liberar de novo. */
  protected async resendConfirmation(): Promise<void> {
    this.resendState.set('sending');
    try {
      await firstValueFrom(this.authApi.resendEmailConfirmation(this.model().email));
      this.resendState.set('sent');
    } catch (error) {
      this.resendState.set('idle');
      this.failure.set(toApiError(error));
    }
    this.startCooldown();
  }

  private startCooldown(): void {
    clearInterval(this.cooldownTimer);
    this.resendCooldown.set(RESEND_COOLDOWN_SECONDS);
    this.cooldownTimer = setInterval(() => {
      this.resendCooldown.update((seconds) => Math.max(0, seconds - 1));
      if (this.resendCooldown() === 0) {
        clearInterval(this.cooldownTimer);
      }
    }, 1000);
  }

  protected readonly model = signal<RegisterModel>({
    name: '',
    email: '',
    cpf: '',
    password: '',
    birthDate: '',
    biologicalSex: 'Female',
    heightInCm: null,
    goal: 'WeightLoss',
    // LGPD: os aceites começam sempre desmarcados.
    acceptHealthData: false,
    acceptInternationalTransfer: false,
  });

  /** O texto e a versão do termo dos dados de saúde, mostrados antes do botão "Criar conta". */
  protected readonly consentTerm = httpResource<HealthDataConsentTerm>(() =>
    apiUrl(HEALTH_DATA_CONSENT_TERM_URL),
  );

  protected readonly registerForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'Informe seu nome completo.' });
      maxLength(path.name, 150, { message: 'O nome deve ter no máximo 150 caracteres.' });
      required(path.email, { message: 'Informe seu e-mail.' });
      email(path.email, { message: 'Informe um e-mail válido.' });
      maxLength(path.email, 254, { message: 'O e-mail deve ter no máximo 254 caracteres.' });
      required(path.cpf, { message: 'Informe seu CPF.' });
      maxLength(path.cpf, 14, { message: 'Informe um CPF válido.' });
      validate(path.cpf, ({ value }) =>
        value().trim() === '' || isValidCpf(value())
          ? undefined
          : { kind: 'cpf', message: 'Informe um CPF válido.' },
      );
      required(path.birthDate, { message: 'Informe sua data de nascimento.' });
      validate(path.birthDate, ({ value }) => {
        if (value().trim() === '') {
          return undefined;
        }
        const validationMessage = birthDateError(value());
        return validationMessage ? { kind: 'birth-date', message: validationMessage } : undefined;
      });
      required(path.heightInCm, { message: 'Informe sua altura.' });
      min(path.heightInCm, 1, { message: 'A altura deve ser maior que zero.' });
      validate(path.heightInCm, ({ value }) => {
        const height = value();
        return height === null || (Number.isInteger(height) && height <= 999)
          ? undefined
          : { kind: 'height', message: 'Informe uma altura de até 3 dígitos.' };
      });
      required(path.password, { message: 'Crie uma senha.' });
      minLength(path.password, 15, { message: 'A senha deve ter pelo menos 15 caracteres.' });
      maxLength(path.password, 128, { message: 'A senha deve ter no máximo 128 caracteres.' });
      validate(path.acceptHealthData, ({ value }) =>
        value()
          ? undefined
          : {
              kind: 'consent',
              message: 'Para criar a conta, autorize o uso dos seus dados de saúde.',
            },
      );
      validate(path.acceptInternationalTransfer, ({ value }) =>
        value()
          ? undefined
          : {
              kind: 'consent',
              message:
                'Para criar a conta, autorize a guarda dos dados em serviços fora do Brasil.',
            },
      );
    },
    { name: 'register', submission: { action: (fieldTree) => this.register(fieldTree) } },
  );

  /** Os aceites são lidos e escritos pelo app-health-data-consent-checks. */
  protected readonly acceptHealthData = this.registerForm.acceptHealthData().value;
  protected readonly acceptInternationalTransfer =
    this.registerForm.acceptInternationalTransfer().value;
  protected readonly healthDataError = computed(() =>
    consentError(this.registerForm.acceptHealthData()),
  );
  protected readonly internationalTransferError = computed(() =>
    consentError(this.registerForm.acceptInternationalTransfer()),
  );

  protected readonly failure = signal<ApiError | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly sexOptions: readonly { value: BiologicalSex; label: string }[] = [
    { value: 'Male', label: 'Masculino' },
    { value: 'Female', label: 'Feminino' },
  ];
  protected readonly goalOptions: readonly {
    value: PatientGoal;
    label: string;
    icon: 'goal' | 'scale' | 'dumbbell';
  }[] = [
    { value: 'WeightLoss', label: 'Emagrecimento', icon: 'goal' },
    { value: 'Maintenance', label: 'Manutenção', icon: 'scale' },
    { value: 'MuscleGain', label: 'Ganho de massa', icon: 'dumbbell' },
  ];

  protected readonly passwordLength = computed(() => this.model().password.length);
  protected readonly passwordProgress = computed(() =>
    Math.min(100, Math.round((this.passwordLength() / 15) * 100)),
  );
  protected readonly maxBirthDate = computed(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().slice(0, 10);
  });

  protected togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  protected selectSex(sex: BiologicalSex): void {
    this.model.update((current) => ({ ...current, biologicalSex: sex }));
  }

  protected selectGoal(goal: PatientGoal): void {
    this.model.update((current) => ({ ...current, goal }));
  }

  protected isSexSelected(sex: BiologicalSex): boolean {
    return this.model().biologicalSex === sex;
  }

  protected isGoalSelected(goal: PatientGoal): boolean {
    return this.model().goal === goal;
  }

  protected formatCpf(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatCpf(input.value);
    input.value = formatted;
    this.model.update((current) => ({ ...current, cpf: formatted }));
  }

  protected formatBirthDate(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 8);
    const formatted = digits
      .replace(/^(\d{2})(\d)/, '$1/$2')
      .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
    input.value = formatted;
    this.model.update((current) => ({ ...current, birthDate: formatted }));
  }

  protected setBirthDateFromPicker(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) {
      return;
    }

    const [year, month, day] = input.value.split('-');
    const formatted = `${day}/${month}/${year}`;
    this.model.update((current) => ({ ...current, birthDate: formatted }));
  }

  protected openBirthDatePicker(input: HTMLInputElement): void {
    const picker = input as HTMLInputElement & { showPicker?: () => void };
    if (picker.showPicker) {
      picker.showPicker();
    } else {
      picker.focus();
      picker.click();
    }
  }

  private async register(fieldTree: FieldTree<RegisterModel>): Promise<TreeValidationResult> {
    this.failure.set(null);
    this.successMessage.set(null);

    try {
      const model = this.model();
      const request: PatientRegistrationRequest = {
        ...model,
        // A validação do formulário já garantiu a altura; o "?? 0" só satisfaz o tipo.
        heightInCm: model.heightInCm ?? 0,
        birthDate: toIsoDate(model.birthDate),
        // Sem o termo carregado o botão fica desabilitado; o "?? ''" só satisfaz o tipo.
        healthDataConsentVersion: this.consentTerm.value()?.version ?? '',
      };
      const response = await firstValueFrom(this.authApi.registerPatient(request));
      this.successMessage.set(response.message);
      // O e-mail acabou de sair: o reenvio só libera depois da espera.
      this.startCooldown();
      return undefined;
    } catch (error) {
      const apiError = toApiError(error);
      this.failure.set(apiError);
      // "O termo foi atualizado": mostra o texto novo, e os aceites precisam ser dados de novo.
      if (apiError.fieldErrors['healthdataconsentversion']) {
        this.consentTerm.reload();
        this.model.update((current) => ({
          ...current,
          acceptHealthData: false,
          acceptInternationalTransfer: false,
        }));
      }
      return toFieldErrors(apiError, {
        name: fieldTree.name,
        email: fieldTree.email,
        cpf: fieldTree.cpf,
        password: fieldTree.password,
        birthDate: fieldTree.birthDate,
        biologicalSex: fieldTree.biologicalSex,
        heightInCm: fieldTree.heightInCm,
        goal: fieldTree.goal,
        acceptHealthData: fieldTree.acceptHealthData,
        acceptInternationalTransfer: fieldTree.acceptInternationalTransfer,
      });
    }
  }
}

/** O erro do aceite aparece depois de uma tentativa de envio, como nos outros campos. */
function consentError(state: {
  touched(): boolean;
  errors(): readonly { message?: string }[];
}): string | null {
  return state.touched() ? (state.errors()[0]?.message ?? null) : null;
}

function toIsoDate(value: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
}

function birthDateError(value: string): string | undefined {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    return 'Informe uma data válida no formato dd/mm/aaaa.';
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  const isCalendarDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  if (!isCalendarDate) {
    return 'Informe uma data válida.';
  }

  const today = new Date();
  if (date > today) {
    return 'A data de nascimento não pode ser futura.';
  }

  let age = today.getFullYear() - year;
  const birthdayHasNotHappened =
    today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day);
  if (birthdayHasNotHappened) {
    age--;
  }

  return age < 18 ? 'Você precisa ter pelo menos 18 anos.' : undefined;
}

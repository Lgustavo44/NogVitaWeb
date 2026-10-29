import { Component, inject, output, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  email,
  form,
  maxLength,
  required,
  validate,
} from '@angular/forms/signals';
import { LucideMailPlus } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { errorSummary, toApiError, toFieldErrors } from '../../../core/http/api-error';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { FieldInput } from '../../../shared/ui/field/field-input';
import { Modal } from '../../../shared/ui/modal/modal';
import { formatCpf, isValidCpf } from '../../../shared/util/cpf';
import { AdminApi } from '../admin-api';
import { CRN_REGIONS } from '../admin.models';

interface InviteForm {
  name: string;
  email: string;
  cpf: string;
  crnRegion: string;
  crnNumber: string;
}

/**
 * Pré-cadastro do nutricionista, que recebe o convite por e-mail. Se o e-mail e o CPF forem de
 * um paciente, a mesma conta ganha o papel de nutricionista.
 */
@Component({
  selector: 'app-invite-nutritionist-modal',
  imports: [Alert, Button, Field, FieldInput, FormField, FormRoot, LucideMailPlus, Modal],
  template: `
    <app-modal
      heading="Convidar nutricionista"
      subtitle="O profissional recebe por e-mail um link para definir a senha."
      [busy]="busy()"
      (closed)="closed.emit()"
    >
      @if (createdWithoutEmail(); as userId) {
        <app-alert tone="warning" heading="Cadastro feito, mas o e-mail não foi enviado">
          O pré-cadastro foi criado. Reenvie o convite para a pessoa receber o link.
        </app-alert>
        @if (error(); as message) {
          <app-alert tone="danger">{{ message }}</app-alert>
        }
      } @else {
        <form [formRoot]="inviteForm" id="form-convite" class="flex flex-col gap-4">
          <app-field label="Nome completo">
            <input appInput cdkFocusInitial [formField]="inviteForm.name" autocomplete="off" />
          </app-field>
          <app-field label="E-mail">
            <input
              appInput
              [formField]="inviteForm.email"
              type="email"
              autocomplete="off"
              placeholder="nome@exemplo.com"
            />
          </app-field>
          <app-field label="CPF">
            <input
              appInput
              [formField]="inviteForm.cpf"
              inputmode="numeric"
              placeholder="000.000.000-00"
              autocomplete="off"
              (input)="maskCpf($event)"
            />
          </app-field>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label for="crn-regiao" class="text-label-md text-ink">Região do CRN</label>
              <select
                id="crn-regiao"
                class="h-11 w-full rounded-control border border-line bg-surface px-3 text-body-lg text-ink focus:border-focus focus:ring-4 focus:ring-primary/20 focus:outline-none"
                (change)="setRegion($event)"
              >
                @for (region of regions; track region) {
                  <option [value]="region" [selected]="model().crnRegion === region.toString()">
                    CRN-{{ region }}
                  </option>
                }
              </select>
            </div>
            <app-field label="Número do CRN">
              <input appInput [formField]="inviteForm.crnNumber" autocomplete="off" />
            </app-field>
          </div>
          <p class="text-body-sm text-ink-muted">
            Se o e-mail e o CPF já forem de um paciente, a mesma conta ganha o papel de
            nutricionista, sem perder o histórico.
          </p>
          @if (error(); as message) {
            <app-alert tone="danger">{{ message }}</app-alert>
          }
        </form>
      }

      <ng-container modalActions>
        @if (createdWithoutEmail(); as userId) {
          <button
            appButton
            variant="soft"
            type="button"
            [disabled]="busy()"
            (click)="closed.emit()"
          >
            Fechar
          </button>
          <button appButton type="button" [loading]="busy()" (click)="resend(userId)">
            <svg lucideMailPlus class="size-5"></svg>
            Reenviar convite
          </button>
        } @else {
          <button
            appButton
            variant="soft"
            type="button"
            [disabled]="busy()"
            (click)="closed.emit()"
          >
            Cancelar
          </button>
          <button appButton type="submit" form="form-convite" [loading]="busy()">
            <svg lucideMailPlus class="size-5"></svg>
            Enviar convite
          </button>
        }
      </ng-container>
    </app-modal>
  `,
})
export class InviteNutritionistModal {
  private readonly api = inject(AdminApi);

  /** Convite enviado (ou pré-cadastro feito): a lista precisa recarregar. */
  readonly invited = output<{ emailSent: boolean }>();
  readonly closed = output();

  protected readonly regions = CRN_REGIONS;
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Id do pré-cadastro cujo e-mail falhou: o modal passa a oferecer só o reenvio. */
  protected readonly createdWithoutEmail = signal<string | null>(null);

  protected readonly model = signal<InviteForm>({
    name: '',
    email: '',
    cpf: '',
    crnRegion: '3',
    crnNumber: '',
  });
  protected readonly inviteForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'Informe o nome.' });
      maxLength(path.name, 150, { message: 'O nome pode ter até 150 caracteres.' });
      required(path.email, { message: 'Informe o e-mail.' });
      email(path.email, { message: 'Informe um e-mail válido.' });
      maxLength(path.email, 254, { message: 'Informe um e-mail válido.' });
      required(path.cpf, { message: 'Informe o CPF.' });
      validate(path.cpf, ({ value }) =>
        value() === '' || isValidCpf(value())
          ? undefined
          : { kind: 'cpf', message: 'Informe um CPF válido.' },
      );
      required(path.crnNumber, { message: 'Informe o número do CRN.' });
      maxLength(path.crnNumber, 20, { message: 'O número pode ter até 20 caracteres.' });
    },
    {
      name: 'invite',
      submission: {
        action: async (fieldTree) => {
          this.busy.set(true);
          this.error.set(null);
          const { name, email: mail, cpf, crnRegion, crnNumber } = this.model();
          try {
            const response = await firstValueFrom(
              this.api.preRegisterNutritionist({
                name: name.trim(),
                email: mail.trim(),
                cpf,
                crnRegion: Number(crnRegion),
                crnNumber: crnNumber.trim(),
              }),
            );
            this.invited.emit({ emailSent: response.invitationEmailSent });
            if (!response.invitationEmailSent) {
              this.createdWithoutEmail.set(response.userId);
            }
            return undefined;
          } catch (error) {
            const apiError = toApiError(error);
            this.error.set(apiError.message);
            return toFieldErrors(apiError, {
              name: fieldTree.name,
              email: fieldTree.email,
              cpf: fieldTree.cpf,
              crnNumber: fieldTree.crnNumber,
            });
          } finally {
            this.busy.set(false);
          }
        },
      },
    },
  );

  protected maskCpf(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatCpf(input.value);
    input.value = formatted;
    this.model.update((current) => ({ ...current, cpf: formatted }));
  }

  protected setRegion(event: Event): void {
    const crnRegion = (event.target as HTMLSelectElement).value;
    this.model.update((current) => ({ ...current, crnRegion }));
  }

  protected async resend(userId: string): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(this.api.resendInvitation(userId));
      if (response.invitationEmailSent) {
        this.invited.emit({ emailSent: true });
        this.closed.emit();
      } else {
        this.error.set('O e-mail falhou de novo. Tente em instantes.');
      }
    } catch (error) {
      this.error.set(errorSummary(error));
    } finally {
      this.busy.set(false);
    }
  }
}

import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideCircleAlert, LucideFileCheck, LucideSearch } from '@lucide/angular';
import { toApiError } from '../../core/http/api-error';
import { apiUrl } from '../../core/http/api-url';
import { Button } from '../../shared/ui/button/button';
import { Logo } from '../../shared/ui/logo/logo';

/** A conferência pública de um PDF de plano. A API nunca devolve dados do paciente aqui. */
interface PlanDocumentVerification {
  code: string;
  kind: 'NutritionPlan' | 'Anamnesis';
  issuedAtUtc: string;
  nutritionistName: string;
  crnRegion: number;
  crnNumber: string;
  sha256: string;
}

const KIND_LABELS: Record<PlanDocumentVerification['kind'], string> = {
  NutritionPlan: 'Plano alimentar',
  Anamnesis: 'Anamnese',
};

/** O código impresso no rodapé do PDF: 12 letras e números, com ou sem os traços. */
const CODE_PATTERN = /^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/;

/** `/verificar-documento/:code`: o link impresso no rodapé de cada PDF de plano alimentar. */
@Component({
  selector: 'app-verify-document',
  imports: [Button, DatePipe, Logo, LucideCircleAlert, LucideFileCheck, LucideSearch],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <div class="flex flex-col items-center gap-3 text-center">
      <app-logo class="h-10" priority />
      <h1 class="text-headline-lg text-ink">Conferir documento</h1>
      <p class="text-body-md text-ink-muted">
        Digite o código verificador impresso no rodapé do PDF do plano alimentar ou da anamnese.
      </p>
    </div>

    <form class="flex gap-2" (submit)="$event.preventDefault(); search()">
      <label class="sr-only" for="codigo-documento">Código verificador</label>
      <input
        id="codigo-documento"
        class="h-11 w-full rounded-control border border-line bg-surface px-3 text-body-lg tracking-wider text-ink uppercase focus:border-focus focus:ring-4 focus:ring-primary/20 focus:outline-none"
        placeholder="ABCD-EFGH-JKLM"
        autocomplete="off"
        [value]="typed()"
        (input)="typed.set($any($event.target).value)"
      />
      <button appButton type="submit" [disabled]="!isValidCode(typed())">
        <svg lucideSearch class="size-5"></svg>
        Conferir
      </button>
    </form>

    @if (document.isLoading()) {
      <div
        class="h-40 rounded-container bg-surface-muted motion-safe:animate-pulse"
        aria-hidden="true"
      ></div>
      <span class="sr-only" role="status">Conferindo o documento…</span>
    } @else if (document.hasValue()) {
      @let found = document.value();
      <section
        class="flex flex-col gap-4 rounded-container bg-surface p-5 shadow-1"
        aria-labelledby="documento-valido"
        role="status"
      >
        <div class="flex items-center gap-3">
          <span
            class="flex size-10 items-center justify-center rounded-full bg-success-soft text-success-ink"
          >
            <svg lucideFileCheck class="size-5"></svg>
          </span>
          <h2 id="documento-valido" class="text-title-md text-ink">
            {{ kindLabels[found.kind] }} emitido pelo NogVita
          </h2>
        </div>
        <dl class="grid gap-3 text-body-md sm:grid-cols-2">
          <div>
            <dt class="text-body-sm text-ink-muted">Nutricionista</dt>
            <dd class="font-semibold text-ink">{{ found.nutritionistName }}</dd>
          </div>
          <div>
            <dt class="text-body-sm text-ink-muted">CRN</dt>
            <dd class="font-semibold text-ink">CRN-{{ found.crnRegion }} {{ found.crnNumber }}</dd>
          </div>
          <div>
            <dt class="text-body-sm text-ink-muted">Emitido em</dt>
            <dd class="font-semibold text-ink">
              {{ found.issuedAtUtc | date: "dd/MM/yyyy 'às' HH:mm" : '-0300' }} (horário de
              Brasília)
            </dd>
          </div>
          <div>
            <dt class="text-body-sm text-ink-muted">Código</dt>
            <dd class="font-semibold text-ink">{{ found.code }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-body-sm text-ink-muted">Impressão digital do arquivo (SHA-256)</dt>
            <dd class="font-mono text-body-sm break-all text-ink">{{ found.sha256 }}</dd>
          </div>
        </dl>
        <p class="text-body-sm text-ink-muted">
          O código confirma quem emitiu o documento e quando. Ele não mostra nenhum dado do
          paciente.
        </p>
      </section>
    } @else if (notFound()) {
      <div
        class="flex items-start gap-2.5 rounded-control bg-danger-soft p-4 text-danger-ink"
        role="alert"
      >
        <svg lucideCircleAlert class="mt-0.5 size-5 shrink-0"></svg>
        <span>Documento não encontrado. Confira o código.</span>
      </div>
    } @else if (document.error()) {
      <div
        class="flex items-start gap-2.5 rounded-control bg-danger-soft p-4 text-danger-ink"
        role="alert"
      >
        <svg lucideCircleAlert class="mt-0.5 size-5 shrink-0"></svg>
        <span>{{ errorMessage() }}</span>
      </div>
    }
  `,
})
export class VerifyDocument {
  private readonly router = inject(Router);
  private readonly code = signal(inject(ActivatedRoute).snapshot.paramMap.get('code') ?? '');

  protected readonly typed = signal(this.code());
  protected readonly kindLabels = KIND_LABELS;

  protected readonly document = httpResource<PlanDocumentVerification>(() =>
    this.isValidCode(this.code())
      ? apiUrl(`/plan-documents/${encodeURIComponent(this.code())}`)
      : undefined,
  );
  protected readonly notFound = computed(() => toApiError(this.document.error()).status === 404);
  protected readonly errorMessage = computed(() => toApiError(this.document.error()).message);

  protected isValidCode(code: string): boolean {
    return CODE_PATTERN.test(code.trim());
  }

  protected search(): void {
    const code = this.typed().trim().toUpperCase();
    this.code.set(code);
    void this.router.navigate(['/verificar-documento', code], { replaceUrl: true });
  }
}

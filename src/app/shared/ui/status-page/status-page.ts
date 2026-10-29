import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideCircleHelp,
  LucideFileQuestion,
  LucideHome,
  LucideLockKeyhole,
  LucideLogIn,
  LucideRefreshCw,
  LucideShieldAlert,
  LucideUserRound,
} from '@lucide/angular';
import { Session } from '../../../core/auth/session';
import { Button } from '../button/button';
import { Logo } from '../logo/logo';

type StatusKind = 'not-found' | 'forbidden' | 'session-expired';

@Component({
  selector: 'app-status-page',
  imports: [
    Button,
    Logo,
    LucideArrowLeft,
    LucideCircleHelp,
    LucideFileQuestion,
    LucideHome,
    LucideLockKeyhole,
    LucideLogIn,
    LucideRefreshCw,
    LucideShieldAlert,
    LucideUserRound,
    RouterLink,
  ],
  host: { class: 'flex flex-col items-center gap-8 text-center' },
  template: `
    <app-logo class="h-10" priority />

    @switch (kind) {
      @case ('not-found') {
        <div class="flex flex-col items-center gap-5">
          <span class="rounded-pill bg-surface-muted px-3 py-1 text-label-sm uppercase tracking-wide text-ink-muted">
            Código de estado: 404
          </span>
          <div class="flex items-center gap-2 text-5xl font-bold text-ink" aria-hidden="true">
            <span>4</span>
            <span class="flex size-14 items-center justify-center rounded-full bg-info-soft text-info-ink">
              <svg lucideFileQuestion class="size-8"></svg>
            </span>
            <span>4</span>
          </div>
          <div class="flex flex-col gap-2">
            <h1 class="text-headline-lg text-ink">Página não encontrada</h1>
            <p class="max-w-lg text-body-lg text-ink-muted">
              O endereço que você tentou acessar não existe, mudou de lugar ou está temporariamente
              indisponível.
            </p>
          </div>
        </div>
      }
      @case ('forbidden') {
        <div class="flex flex-col items-center gap-5">
          <span class="rounded-pill bg-info-soft px-3 py-1 text-label-sm uppercase tracking-wide text-info-ink">
            Acesso restrito · Erro 403
          </span>
          <div class="flex size-24 items-center justify-center rounded-full bg-info-soft text-info-ink">
            <svg lucideShieldAlert class="size-12"></svg>
          </div>
          <div class="flex flex-col gap-2">
            <h1 class="text-headline-lg text-ink">Sem permissão para acessar esta área</h1>
            <p class="max-w-lg text-body-lg text-ink-muted">
              Sua conta não possui o perfil ou as credenciais necessárias para visualizar este
              conteúdo. Se você possui mais de um perfil, alterne para a área correta.
            </p>
          </div>
        </div>
      }
      @default {
        <div class="flex flex-col items-center gap-5">
          <span class="rounded-pill bg-info-soft px-3 py-1 text-label-sm uppercase tracking-wide text-info-ink">
            Segurança e privacidade
          </span>
          <div class="flex size-24 items-center justify-center rounded-full bg-info-soft text-info-ink">
            <svg lucideLockKeyhole class="size-12"></svg>
          </div>
          <div class="flex flex-col gap-2">
            <h1 class="text-headline-lg text-ink">Sua sessão expirou</h1>
            <p class="max-w-lg text-body-lg text-ink-muted">
              Por segurança, encerramos sua conexão após um período de inatividade. Entre novamente
              para continuar.
            </p>
          </div>
        </div>
      }
    }

    @if (kind === 'not-found') {
      <div class="flex flex-wrap justify-center gap-3">
        <a routerLink="/" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 py-2 text-label-lg font-semibold text-on-primary shadow-1 hover:bg-primary-hover">
          <svg lucideHome class="size-5"></svg>
          Voltar ao início
        </a>
        <button appButton variant="soft" type="button" (click)="goBack()">
          <svg lucideArrowLeft class="size-5"></svg>
          Página anterior
        </button>
      </div>
      <div class="flex w-full max-w-xl flex-col gap-3 rounded-container bg-surface-muted p-4">
        <p class="text-label-md uppercase tracking-wide text-ink-muted">Talvez você estivesse procurando</p>
        <div class="grid gap-2 sm:grid-cols-3">
          <a routerLink="/login" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-surface px-3 text-body-md text-ink shadow-1 hover:text-link">
            <svg lucideUserRound class="size-4 text-link"></svg>
            Área do paciente
          </a>
          <a routerLink="/login" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-surface px-3 text-body-md text-ink shadow-1 hover:text-link">
            <svg lucideShieldAlert class="size-4 text-info-ink"></svg>
            Área profissional
          </a>
          <a routerLink="/login" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-surface px-3 text-body-md text-ink shadow-1 hover:text-link">
            <svg lucideCircleHelp class="size-4 text-info-ink"></svg>
            Central de ajuda
          </a>
        </div>
      </div>
    } @else if (kind === 'forbidden') {
      <div class="flex flex-wrap justify-center gap-3">
        <a routerLink="/inicio" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 py-2 text-label-lg font-semibold text-on-primary shadow-1 hover:bg-primary-hover">
          <svg lucideHome class="size-5"></svg>
          Voltar para minha área
        </a>
        <a routerLink="/login" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-soft/30 px-5 py-2 text-label-lg font-semibold text-soft-ink hover:bg-soft/50">
          <svg lucideLogIn class="size-5"></svg>
          Trocar de conta
        </a>
      </div>
      <p class="max-w-lg text-body-sm text-ink-muted">
        Acha que isto é um engano?
        <a href="mailto:suporte@nogvita.com.br" class="font-semibold text-link hover:underline">
          Fale com o suporte NogVita.
        </a>
      </p>
    } @else {
      <div class="flex w-full max-w-md flex-col gap-3">
        <a routerLink="/login" class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-primary px-5 py-2 text-label-lg font-semibold text-on-primary shadow-1 hover:bg-primary-hover">
          <svg lucideLogIn class="size-5"></svg>
          Fazer login novamente
        </a>
        <a routerLink="/login" class="inline-flex min-h-11 items-center justify-center gap-2 text-body-lg text-link hover:underline">
          <svg lucideRefreshCw class="size-5"></svg>
          Entrar com outra conta
        </a>
      </div>
    }
  `,
})
export class StatusPage {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly session = inject(Session);

  protected readonly kind = (this.route.snapshot.data['status'] as StatusKind | undefined) ?? 'not-found';

  constructor() {
    if (this.kind === 'session-expired') {
      this.session.clear();
    }
  }

  protected goBack(): void {
    this.location.back();
  }
}

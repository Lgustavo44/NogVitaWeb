import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Alert } from '../ui/alert/alert';
import { Button } from '../ui/button/button';

/** Data da versão atual da política e dos termos. Troque quando eles mudarem: o aviso volta para todos. */
export const POLICY_VERSION = '2026-11-03';
const STORAGE_KEY = 'nv-policy-notice';

/**
 * Aviso "com destaque" da mudança da política (LGPD, art. 8º, §6º) para quem não passa pelo
 * aceite dos dados de saúde: nutricionistas e administração. O paciente vê o aviso no próprio aceite.
 */
@Component({
  selector: 'app-policy-notice',
  imports: [Alert, Button],
  host: { class: 'block empty:hidden' },
  template: `
    @if (visible()) {
      <app-alert class="mb-6" heading="Atualizamos a Política de Privacidade e os Termos de Uso">
        <p>
          A nova versão é de 3 de novembro de 2026. O que mudou está no topo da
          <a
            href="/legal/politica-de-privacidade.pdf"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-link underline"
            >Política de Privacidade</a
          >
          e dos
          <a
            href="/legal/termos-de-uso.pdf"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-link underline"
            >Termos de Uso</a
          >.
        </p>
        <button appButton variant="soft" type="button" class="mt-3" (click)="dismiss()">
          Entendi
        </button>
      </app-alert>
    }
  `,
})
export class PolicyNotice {
  private readonly storage = localStorageOf(inject(DOCUMENT));
  protected readonly visible = signal(this.read() !== POLICY_VERSION);

  protected dismiss(): void {
    this.visible.set(false);
    try {
      this.storage?.setItem(STORAGE_KEY, POLICY_VERSION);
    } catch {
      // Sem armazenamento: o aviso some agora e volta na próxima visita.
    }
  }

  private read(): string | null {
    try {
      return this.storage?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }
}

function localStorageOf(document: Document): Storage | null {
  try {
    return document.defaultView?.localStorage ?? null;
  } catch {
    return null;
  }
}

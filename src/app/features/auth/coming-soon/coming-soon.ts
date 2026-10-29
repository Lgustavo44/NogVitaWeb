import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Provisória: ocupa as rotas das telas que ainda vamos construir (cadastro, esqueci a senha). */
@Component({
  selector: 'app-coming-soon',
  imports: [RouterLink],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <div class="flex flex-col gap-2 text-center">
      <h1 class="text-headline-lg text-ink">Em construção</h1>
      <p class="text-body-md text-ink-muted">Esta tela chega nas próximas etapas.</p>
    </div>
    <a routerLink="/login" class="text-center font-semibold text-link hover:underline">
      Voltar para o login
    </a>
  `,
})
export class ComingSoon {}

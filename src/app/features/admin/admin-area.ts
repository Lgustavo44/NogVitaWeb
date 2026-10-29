import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  LucideLayoutDashboard,
  LucideStethoscope,
  LucideUserRound,
  LucideUsers,
  LucideUtensils,
} from '@lucide/angular';
import { CurrentUser } from '../../core/auth/current-user';
import { AppShell, NavItem } from '../../shared/layout/app-shell/app-shell';
import { adminUserResource } from './admin-api';

/** Moldura da administração: o AppShell com o menu do admin. */
@Component({
  selector: 'app-admin-area',
  imports: [AppShell, RouterOutlet],
  template: `
    <app-shell
      area="Admin"
      menuTitle="Painel administrativo"
      userDetail="Administrador"
      [navigation]="navigation"
      [userName]="userName()"
    >
      <router-outlet />
    </app-shell>
  `,
})
export class AdminArea {
  private readonly me = adminUserResource(inject(CurrentUser).userId);

  protected readonly userName = computed(() => (this.me.hasValue() ? this.me.value().name : null));
  protected readonly navigation: NavItem[] = [
    { label: 'Visão geral', icon: LucideLayoutDashboard, link: '/admin', exact: true },
    { label: 'Usuários', icon: LucideUsers },
    { label: 'Nutricionistas', icon: LucideStethoscope },
    { label: 'Pacientes', icon: LucideUserRound },
    { label: 'Alimentos', icon: LucideUtensils },
  ];
}

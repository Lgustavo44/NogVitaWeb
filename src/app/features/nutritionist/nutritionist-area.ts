import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  LucideClipboardList,
  LucideHouse,
  LucideInbox,
  LucideUserRound,
  LucideUsers,
  LucideUtensils,
} from '@lucide/angular';
import { AppShell, NavItem } from '../../shared/layout/app-shell/app-shell';
import { NutritionistProfileStore } from './nutritionist-profile-store';

/** Moldura da área do nutricionista: o AppShell com o menu clínico. */
@Component({
  selector: 'app-nutritionist-area',
  imports: [AppShell, RouterOutlet],
  providers: [NutritionistProfileStore],
  template: `
    <app-shell
      area="Nutritionist"
      menuTitle="Menu clínico"
      [navigation]="navigation"
      [userName]="userName()"
      [userDetail]="crn()"
    >
      <router-outlet />
    </app-shell>
  `,
})
export class NutritionistArea {
  private readonly profile = inject(NutritionistProfileStore).profile;

  protected readonly userName = computed(() =>
    this.profile.hasValue() ? this.profile.value().name : null,
  );
  protected readonly crn = computed(() =>
    this.profile.hasValue()
      ? `CRN-${this.profile.value().crnRegion} ${this.profile.value().crnNumber}`
      : null,
  );
  protected readonly navigation: NavItem[] = [
    { label: 'Início', icon: LucideHouse, link: '/nutricionista', exact: true },
    { label: 'Solicitações', icon: LucideInbox },
    { label: 'Pacientes', icon: LucideUsers },
    { label: 'Planos alimentares', icon: LucideClipboardList },
    { label: 'Alimentos', icon: LucideUtensils },
    { label: 'Meu perfil', icon: LucideUserRound, link: '/nutricionista/perfil' },
  ];
}

import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  LucideClipboardList,
  LucideClipboardPen,
  LucideHouse,
  LucideInbox,
  LucideUserRound,
  LucideUsers,
  LucideUtensils,
} from '@lucide/angular';
import { AppShell, NavItem } from '../../shared/layout/app-shell/app-shell';
import { PolicyNotice } from '../../shared/legal/policy-notice';
import { NutritionistProfileStore } from './nutritionist-profile-store';

/** Moldura da área do nutricionista: o AppShell com o menu clínico. */
@Component({
  selector: 'app-nutritionist-area',
  imports: [AppShell, PolicyNotice, RouterOutlet],
  providers: [NutritionistProfileStore],
  template: `
    <app-shell
      area="Nutritionist"
      menuTitle="Menu clínico"
      [navigation]="navigation"
      [userName]="userName()"
      [userDetail]="crn()"
      [userPhotoUrl]="photoUrl()"
    >
      <app-policy-notice />
      <router-outlet />
    </app-shell>
  `,
})
export class NutritionistArea {
  private readonly profile = inject(NutritionistProfileStore).profile;

  protected readonly userName = computed(() =>
    this.profile.hasValue() ? this.profile.value().name : null,
  );
  protected readonly photoUrl = computed(() =>
    this.profile.hasValue() ? (this.profile.value().photoUrl ?? null) : null,
  );
  protected readonly crn = computed(() =>
    this.profile.hasValue()
      ? `CRN-${this.profile.value().crnRegion} ${this.profile.value().crnNumber}`
      : null,
  );
  protected readonly navigation: NavItem[] = [
    { label: 'Início', icon: LucideHouse, link: '/nutricionista', exact: true },
    { label: 'Solicitações', icon: LucideInbox, link: '/nutricionista/solicitacoes' },
    { label: 'Pacientes', icon: LucideUsers, link: '/nutricionista/pacientes' },
    { label: 'Planos alimentares', icon: LucideClipboardList, link: '/nutricionista/planos' },
    { label: 'Questionários', icon: LucideClipboardPen, link: '/nutricionista/questionarios' },
    { label: 'Alimentos', icon: LucideUtensils, link: '/nutricionista/alimentos' },
    { label: 'Meu perfil', icon: LucideUserRound, link: '/nutricionista/perfil' },
  ];
}

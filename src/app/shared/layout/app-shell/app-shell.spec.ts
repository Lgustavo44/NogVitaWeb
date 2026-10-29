import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LucideHouse, LucideScale } from '@lucide/angular';
import { CurrentUser } from '../../../core/auth/current-user';
import { AppShell, NavItem } from './app-shell';

@Component({
  imports: [AppShell],
  template: `
    <app-shell area="Patient" mobileNav="bottom" [navigation]="navigation" userName="Ana Souza">
      <p>conteúdo da tela</p>
    </app-shell>
  `,
})
class Host {
  readonly navigation: NavItem[] = [
    { label: 'Início', icon: LucideHouse, link: '/paciente', exact: true },
    { label: 'Peso', icon: LucideScale },
  ];
}

describe('AppShell', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('mostra o conteúdo, o menu da área e marca o que ainda não existe como "Em breve"', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const sidebar = element.querySelector('#menu-da-area')!;

    expect(element.querySelector('main')?.textContent).toContain('conteúdo da tela');
    expect(sidebar.querySelector('nav a[href="/paciente"]')?.textContent).toContain('Início');
    const soon = sidebar.querySelector('[aria-disabled="true"]');
    expect(soon?.textContent).toContain('Peso');
    expect(soon?.textContent).toContain('Em breve');
  });

  it('mostra as iniciais do nome no botão da conta', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const account = (fixture.nativeElement as HTMLElement).querySelector(
      '[aria-label^="Conta de"]',
    );

    expect(account?.getAttribute('aria-label')).toBe('Conta de Ana Souza');
    expect(account?.textContent).toContain('AS');
  });

  it('oferece trocar só para as outras áreas que a pessoa tem', async () => {
    const currentUser = TestBed.inject(CurrentUser);
    const loading = currentUser.load();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/auth/me')
      .flush({ userId: 'u1', roles: ['Patient', 'Nutritionist'] });
    await loading;

    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const shell = fixture.debugElement.children[0].componentInstance as unknown as {
      otherAreas: () => { path: string }[];
    };

    expect(shell.otherAreas().map((area) => area.path)).toEqual(['/nutricionista']);
  });
});

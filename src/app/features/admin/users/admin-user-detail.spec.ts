import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { CurrentUser } from '../../../core/auth/current-user';
import { AdminUserDetailPage } from './admin-user-detail';

registerLocaleData(localePt);

const account = (id: string, extra: object = {}) => ({
  id,
  name: 'Pessoa Exemplo',
  email: 'pessoa@exemplo.com',
  cpf: '529.982.247-25',
  isActive: true,
  isAdmin: false,
  patient: null,
  nutritionist: null,
  createdAt: '2026-10-20T10:00:00Z',
  updatedAt: null,
  ...extra,
});

describe('AdminUserDetailPage', () => {
  let fixture: ComponentFixture<AdminUserDetailPage>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  function button(text: string): HTMLButtonElement {
    const found = [...element.querySelectorAll('button')].filter((b) =>
      b.textContent?.includes(text),
    );
    return found[found.length - 1];
  }

  async function load(id: string, body: object): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: CurrentUser, useValue: { userId: signal('admin-1') } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminUserDetailPage);
    element = fixture.nativeElement;
    await settle();
    controller.expectOne(`/api/v1/admin/users/${id}`).flush(body);
    await settle();
  }

  afterEach(() => controller.verify());

  it('não oferece desativar a própria conta', async () => {
    await load('admin-1', account('admin-1', { isAdmin: true }));

    expect(element.textContent).toContain('Você não pode desativar a própria conta');
    expect(button('Desativar conta')).toBeUndefined();
  });

  it('avisa que desativar um nutricionista encerra os acompanhamentos e mostra o erro da API', async () => {
    await load(
      'u2',
      account('u2', { nutritionist: { crnRegion: 3, crnNumber: '12345', isActive: true } }),
    );

    button('Desativar conta').click();
    await settle();
    expect(element.querySelector('[role="alertdialog"]')?.textContent).toContain(
      'acompanhamentos ativos são encerrados',
    );

    button('Desativar conta').click();
    await settle();
    controller
      .expectOne('/api/v1/admin/users/u2/deactivate')
      .flush(
        { title: 'Você não pode desativar a sua própria conta.' },
        { status: 409, statusText: 'Conflict' },
      );
    await settle();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('própria conta');
  });

  it('convite pendente: reenvia e avisa quando o e-mail falha', async () => {
    await load(
      'u4',
      account('u4', { nutritionist: { crnRegion: 8, crnNumber: '9876', isActive: false } }),
    );
    expect(element.textContent).toContain('Pendente');

    button('Reenviar convite').click();
    await settle();
    button('Reenviar convite').click();
    await settle();
    controller
      .expectOne('/api/v1/admin/nutritionists/u4/invitation')
      .flush({ invitationEmailSent: false });
    await settle();

    expect(element.textContent).toContain('o e-mail não foi enviado');
  });
});

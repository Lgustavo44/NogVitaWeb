import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NutritionistProfileStore } from '../nutritionist-profile-store';
import { NutritionistProfilePage } from './nutritionist-profile';

@Component({
  imports: [NutritionistProfilePage],
  providers: [NutritionistProfileStore],
  template: `<app-nutritionist-profile />`,
})
class Host {}

describe('NutritionistProfilePage', () => {
  let fixture: ComponentFixture<Host>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  /** Sem whenStable: com requisições abertas (httpResource, envio do form) ele esperaria para sempre. */
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Host);
    element = fixture.nativeElement;
    // O httpResource só dispara a requisição depois do primeiro ciclo de detecção.
    TestBed.tick();
    controller.expectOne('/api/v1/nutritionists/me').flush({
      userId: 'u1',
      name: 'Carla Mendes',
      email: 'carla@exemplo.com',
      crnRegion: 3,
      crnNumber: '12345',
      bio: 'Nutrição clínica.',
    });
    await settle();
  });

  afterEach(() => controller.verify());

  function typeBio(value: string): void {
    const textarea = element.querySelector('textarea')!;
    textarea.value = value;
    textarea.dispatchEvent(new Event('input'));
  }

  it('mostra o CRN e a prévia com a bio que está sendo digitada', async () => {
    typeBio('Foco em emagrecimento.');
    await settle();

    expect(element.textContent).toContain('CRN-3 12345');
    expect(element.querySelector('article')?.textContent).toContain('Foco em emagrecimento.');
  });

  it('bio apagada vai como null (a API remove a apresentação)', async () => {
    typeBio('   ');
    await settle();
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle();

    const request = controller.expectOne('/api/v1/nutritionists/me');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ bio: null });
    request.flush(null);
    await settle();
    controller.expectOne('/api/v1/nutritionists/me').flush({
      userId: 'u1',
      name: 'Carla Mendes',
      email: 'carla@exemplo.com',
      crnRegion: 3,
      crnNumber: '12345',
      bio: null,
    });
  });

  it('não deixa salvar mais de 500 caracteres', async () => {
    typeBio('a'.repeat(501));
    await settle();
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle();

    controller.expectNone('/api/v1/nutritionists/me');
    expect(element.textContent).toContain('até 500 caracteres');
  });
});

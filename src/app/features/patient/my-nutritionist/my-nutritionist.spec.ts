import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MyNutritionistPage } from './my-nutritionist';

const URL = '/api/v1/patients/me/care-relationship';
const CARE = {
  relationshipId: 'r1',
  nutritionistId: 'n1',
  nutritionistName: 'Carla Mendes',
  crnRegion: 3,
  crnNumber: '12345',
  bio: null,
  startedAtUtc: '2026-08-02T12:00:00Z',
};

describe('MyNutritionistPage', () => {
  let fixture: ComponentFixture<MyNutritionistPage>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  function buttonWith(text: string): HTMLButtonElement {
    return [...element.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MyNutritionistPage);
    element = fixture.nativeElement;
    TestBed.tick();
  });

  afterEach(() => controller.verify());

  it('sem acompanhamento (404), mostra o estado vazio e não um erro', async () => {
    controller
      .expectOne(URL)
      .flush(
        { title: 'Você não está em acompanhamento.' },
        { status: 404, statusText: 'Not Found' },
      );
    await settle();

    expect(element.textContent).toContain('ainda não tem nutricionista');
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  it('encerra só depois de confirmar', async () => {
    controller.expectOne(URL).flush(CARE);
    await settle();
    expect(element.textContent).toContain('CRN-3 12345');

    buttonWith('Encerrar acompanhamento').click();
    await settle();
    controller.expectNone(`${URL}/end`);

    buttonWith('Sim, encerrar').click();
    await settle();
    controller.expectOne(`${URL}/end`).flush(null, { status: 204, statusText: 'No Content' });
    await settle();
    controller
      .expectOne(URL)
      .flush(
        { title: 'Você não está em acompanhamento.' },
        { status: 404, statusText: 'Not Found' },
      );
    await settle();

    expect(element.textContent).toContain('ainda não tem nutricionista');
  });
});

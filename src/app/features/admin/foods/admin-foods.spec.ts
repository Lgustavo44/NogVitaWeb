import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminFoodsPage } from './admin-foods';

const FOOD = {
  id: 'f1',
  name: 'Frango, peito, grelhado',
  brand: null,
  barcode: null,
  category: 'Carnes',
  source: 'Taco',
  sourceReference: '1',
  isActive: true,
  energyKcalPer100g: 159,
  proteinPer100g: 32,
  carbohydratePer100g: 0,
  fatPer100g: 2.5,
  fiberPer100g: 0,
  sodiumMgPer100g: 50,
  attribution: 'TACO',
  isComplete: true,
};

describe('AdminFoodsPage', () => {
  let fixture: ComponentFixture<AdminFoodsPage>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  async function search(value: string): Promise<void> {
    const input = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await settle();
    vi.advanceTimersByTime(400);
    await settle();
  }

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminFoodsPage);
    element = fixture.nativeElement;
    await settle();
  });

  afterEach(() => {
    controller.verify();
    vi.useRealTimers();
  });

  it('não busca com menos de 2 letras (a API responderia 400)', async () => {
    controller.expectNone((req) => req.url === '/api/v1/admin/foods');
    await search('f');

    controller.expectNone((req) => req.url === '/api/v1/admin/foods');
    expect(element.textContent).toContain('Busque um alimento');
  });

  it('desativa depois de confirmar e recarrega a busca', async () => {
    await search('frango');
    controller
      .expectOne((req) => req.url === '/api/v1/admin/foods')
      .flush({ items: [FOOD], page: 1, pageSize: 20, totalItems: 1 });
    await settle();

    [...element.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Desativar'))!
      .click();
    await settle();
    expect(element.textContent).toContain('planos que já usam este alimento não mudam');
    const confirm = [...element.querySelectorAll('[role="alertdialog"] button')].find(
      (b) => b.textContent?.trim() === 'Desativar',
    ) as HTMLButtonElement;
    confirm.click();
    await settle();
    controller.expectOne('/api/v1/admin/foods/f1/deactivate').flush(null, {
      status: 204,
      statusText: 'No Content',
    });
    await settle();

    controller
      .expectOne((req) => req.url === '/api/v1/admin/foods')
      .flush({ items: [{ ...FOOD, isActive: false }], page: 1, pageSize: 20, totalItems: 1 });
  });
});

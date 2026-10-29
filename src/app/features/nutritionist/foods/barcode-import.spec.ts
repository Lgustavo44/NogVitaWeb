import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BarcodeImportPage } from './barcode-import';

const PREVIEW = {
  alreadyImported: false,
  foodId: null,
  barcode: '7891000315507',
  name: 'Iogurte natural desnatado',
  brand: 'Marca Exemplo',
  energyKcalPer100g: 41,
  proteinPer100g: 4.2,
  carbohydratePer100g: 5.9,
  fatPer100g: 0,
  fiberPer100g: null,
  sodiumMgPer100g: 65,
  attribution: 'Open Food Facts, ODbL.',
};

describe('BarcodeImportPage', () => {
  let fixture: ComponentFixture<BarcodeImportPage>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  async function consult(value: string): Promise<void> {
    const input = element.querySelector<HTMLInputElement>('input[inputmode="numeric"]')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await settle();
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BarcodeImportPage);
    element = fixture.nativeElement;
    await settle();
  });

  afterEach(() => controller.verify());

  it('limpa o que não é dígito (leitores mandam espaços e hífens)', async () => {
    await consult('789-1000 315507');

    controller.expectOne('/api/v1/foods/barcode/7891000315507').flush(PREVIEW);
  });

  it('não consulta código de tamanho inválido e avisa', async () => {
    await consult('12345');

    controller.expectNone((req) => req.url.includes('/foods/barcode/'));
    expect(element.querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('no 404, explica que o produto não foi encontrado', async () => {
    await consult('7891000315507');
    controller
      .expectOne('/api/v1/foods/barcode/7891000315507')
      .flush({ title: 'Produto não encontrado.' }, { status: 404, statusText: 'Not Found' });
    await settle();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'não encontrado na base nem no Open Food Facts',
    );
  });

  it('mostra a prévia com a atribuição e, ao importar (201), abre o alimento', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await consult('7891000315507');
    controller.expectOne('/api/v1/foods/barcode/7891000315507').flush(PREVIEW);
    await settle();
    expect(element.textContent).toContain('Iogurte natural desnatado');
    expect(element.textContent).toContain('Open Food Facts, ODbL.');

    [...element.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Importar'))!
      .click();
    await settle();
    controller
      .expectOne('/api/v1/foods/barcode/7891000315507/import')
      .flush({ ...PREVIEW, id: 'f9', isActive: true }, { status: 201, statusText: 'Created' });
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/nutricionista/alimentos', 'f9']);
  });

  it('no 422 (dados impossíveis no Open Food Facts), mostra a mensagem da API', async () => {
    await consult('7891000315507');
    controller.expectOne('/api/v1/foods/barcode/7891000315507').flush(PREVIEW);
    await settle();
    [...element.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Importar'))!
      .click();
    await settle();
    controller
      .expectOne('/api/v1/foods/barcode/7891000315507/import')
      .flush(
        { title: 'Os dados nutricionais deste produto são inconsistentes.' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    await settle();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('inconsistentes');
  });
});

import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FindNutritionistPage } from './find-nutritionist';

const LIST = '/api/v1/nutritionists';
const CARE = '/api/v1/patients/me/care-relationship';
const REQUESTS = '/api/v1/patients/me/nutritionist-requests';

const CARLA = { userId: 'n1', name: 'Carla Mendes', crnRegion: 3, crnNumber: '12345', bio: null };
const BRUNO = {
  userId: 'n2',
  name: 'Bruno Lima',
  crnRegion: 4,
  crnNumber: '777',
  bio: 'Esportiva.',
};

describe('FindNutritionistPage', () => {
  let fixture: ComponentFixture<FindNutritionistPage>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  const list = () => controller.expectOne((req) => req.url === LIST);
  const pending = () => controller.expectOne((req) => req.url === REQUESTS && req.method === 'GET');

  async function start(options: { activeCare?: boolean; pendingFor?: string } = {}): Promise<void> {
    fixture = TestBed.createComponent(FindNutritionistPage);
    element = fixture.nativeElement;
    TestBed.tick();
    list().flush({ items: [CARLA, BRUNO], page: 1, pageSize: 12, totalItems: 2 });
    if (options.activeCare) {
      controller.expectOne(CARE).flush({ nutritionistName: 'Outra', crnRegion: 1, crnNumber: '1' });
    } else {
      controller
        .expectOne(CARE)
        .flush(
          { title: 'Você não está em acompanhamento.' },
          { status: 404, statusText: 'Not Found' },
        );
    }
    const items = options.pendingFor
      ? [{ id: 'r1', nutritionistId: options.pendingFor, status: 'Pending' }]
      : [];
    pending().flush({ items, page: 1, pageSize: 50, totalItems: items.length });
    await settle();
  }

  function buttonWith(text: string, root: ParentNode = element): HTMLButtonElement {
    return [...root.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!;
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    vi.useRealTimers();
  });

  it('espera a pessoa parar de digitar antes de buscar (uma requisição só)', async () => {
    await start();
    const input = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    for (const value of ['C', 'Ca', 'Car']) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await settle();
    }
    controller.expectNone((req) => req.url === LIST);

    vi.advanceTimersByTime(400);
    await settle();

    const search: TestRequest = list();
    expect(search.request.params.get('search')).toBe('Car');
    expect(search.request.params.get('page')).toBe('1');
    search.flush({ items: [CARLA], page: 1, pageSize: 12, totalItems: 1 });
  });

  it('envia o pedido com a mensagem vazia como null e marca o card como pendente', async () => {
    await start();
    buttonWith('Solicitar acompanhamento', element.querySelectorAll('article')[0]).click();
    await settle();

    buttonWith('Enviar solicitação', element.querySelector('[role="dialog"]')!).click();
    await settle();
    const post = controller.expectOne((req) => req.url === REQUESTS && req.method === 'POST');
    expect(post.request.body).toEqual({ nutritionistId: 'n1', message: null });
    post.flush({ id: 'r1' }, { status: 201, statusText: 'Created' });
    await settle();
    pending().flush({
      items: [{ id: 'r1', nutritionistId: 'n1', status: 'Pending' }],
      page: 1,
      pageSize: 50,
      totalItems: 1,
    });
    await settle();

    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(element.querySelectorAll('article')[0].textContent).toContain('Solicitação enviada');
  });

  it('com acompanhamento ativo, avisa e não deixa enviar', async () => {
    await start({ activeCare: true });
    buttonWith('Solicitar acompanhamento', element.querySelectorAll('article')[0]).click();
    await settle();
    const dialog = element.querySelector('[role="dialog"]')!;

    expect(dialog.textContent).toContain('Acompanhamento ativo');
    expect(buttonWith('Enviar solicitação', dialog).disabled).toBe(true);
  });
});

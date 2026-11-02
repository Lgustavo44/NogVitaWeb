import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ImageCropper } from '../photos/image-cropper';
import { ProgressPhotosPanel } from './progress-photos-panel';
import { ProgressPhotoDay, ProgressPhotosPerspective } from './progress-photos.models';

@Component({
  imports: [ProgressPhotosPanel],
  template: `
    <app-progress-photos-panel
      [photosPath]="photosPath()"
      [perspective]="perspective()"
      weightRecordsPath="/patients/me/weight-records"
    />
  `,
})
class Host {
  readonly photosPath = signal('/patients/me/progress-photos');
  readonly perspective = signal<ProgressPhotosPerspective>('patient');
}

const LIST = '/api/v1/patients/me/progress-photos';
const CONSENT = `${LIST}/consent`;

const days: ProgressPhotoDay[] = [
  {
    takenOn: '2026-10-30',
    photos: [{ id: 'f2', takenOn: '2026-10-30', angle: 'Front', url: 'https://s.test/f2.webp' }],
  },
  {
    takenOn: '2026-09-30',
    photos: [
      { id: 'f1', takenOn: '2026-09-30', angle: 'Front', url: 'https://s.test/f1.webp' },
      { id: 's1', takenOn: '2026-09-30', angle: 'Side', url: 'https://s.test/s1.webp' },
    ],
  },
];

registerLocaleData(localePt);

describe('ProgressPhotosPanel', () => {
  let controller: HttpTestingController;

  async function render(perspective: ProgressPhotosPerspective = 'patient') {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    });
    controller = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.perspective.set(perspective);
    if (perspective === 'nutritionist') {
      fixture.componentInstance.photosPath.set('/nutritionists/me/patients/p1/progress-photos');
    }
    TestBed.tick();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }
  const buttonWith = (root: ParentNode, text: string) =>
    [...root.querySelectorAll('button')].find((b) => b.textContent?.includes(text));
  const consent = (accepted: boolean) => ({
    version: '1',
    text: 'Suas fotos ficam guardadas com segurança.',
    accepted,
    acceptedAtUtc: accepted ? '2026-10-01T10:00:00Z' : null,
  });

  afterEach(() => controller.verify());

  it('paciente sem termo: mostra o termo e não busca as fotos', async () => {
    const { element } = await render();
    controller.expectOne(CONSENT).flush(consent(false));
    await settle();

    expect(element.textContent).toContain('Suas fotos ficam guardadas com segurança.');
    controller.expectNone(LIST);

    buttonWith(element, 'Aceitar e continuar')!.click();
    const accept = controller.expectOne((r) => r.url === CONSENT && r.method === 'POST');
    expect(accept.request.body).toEqual({ version: '1' });
    accept.flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    controller.expectOne((r) => r.url === CONSENT && r.method === 'GET').flush(consent(true));
    await settle();
    controller.expectOne(LIST).flush([]);
    await settle();

    expect(element.textContent).toContain('Adicionar primeira foto');
  });

  it('galeria por dia, com as vagas vazias de cada ângulo', async () => {
    const { element } = await render();
    controller.expectOne(CONSENT).flush(consent(true));
    await settle();
    controller.expectOne(LIST).flush(days);
    await settle();

    expect(element.querySelectorAll('[aria-label^="Ver foto de"]').length).toBe(3);
    expect(
      element.querySelector('[aria-label="Adicionar foto de lado em 30/10/2026"]'),
    ).toBeTruthy();
    expect(element.textContent).toContain('3 de 90 fotos');
    // Duas datas de frente: dá para comparar.
    expect(buttonWith(element, 'Comparar')).toBeTruthy();
  });

  it('envia data, ângulo e arquivo, e avisa quando vai substituir', async () => {
    const { element } = await render();
    controller.expectOne(CONSENT).flush(consent(true));
    await settle();
    controller.expectOne(LIST).flush(days);
    await settle();

    // Vaga de frente já ocupada no dia 30/09: abrir pelo "Adicionar foto" e escolher essa data.
    (
      element.querySelector('[aria-label="Adicionar foto de costas em 30/09/2026"]') as HTMLElement
    ).click();
    await settle();
    expect(element.textContent).not.toContain('vai substituir');
    buttonWith(element.querySelector('[role="group"]')!, 'Frente')!.click();
    await settle();
    expect(element.textContent).toContain('vai substituir a anterior');

    const input = element.querySelector<HTMLInputElement>('#arquivo-evolucao')!;
    const file = new File(['x'], 'frente.jpg', { type: 'image/jpeg' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    URL.createObjectURL = vi.fn(() => 'blob:previa');
    URL.revokeObjectURL = vi.fn();
    // O recorte usa canvas (o jsdom não tem): o E2E cobre o desenho de verdade.
    const cropped = new File(['recorte'], 'frente.jpg', { type: 'image/jpeg' });
    vi.spyOn(ImageCropper.prototype, 'export').mockResolvedValue(cropped);
    input.dispatchEvent(new Event('change'));
    await settle();
    expect(element.querySelector('[aria-roledescription="área de corte"]')).toBeTruthy();

    element
      .querySelector('form#form-foto-evolucao')!
      .dispatchEvent(new Event('submit', { cancelable: true }));
    await settle();
    const upload = controller.expectOne((r) => r.url === LIST && r.method === 'POST');
    const body = upload.request.body as FormData;
    expect(body.get('file')).toBe(cropped);
    expect(body.get('takenOn')).toBe('2026-09-30');
    expect(body.get('angle')).toBe('Front');
    upload.flush({ id: 'f1', takenOn: '2026-09-30', angle: 'Front', url: 'https://s.test/n.webp' });
    await settle();

    controller.expectOne((r) => r.url === LIST && r.method === 'GET').flush(days);
  });

  it('apagar e revogar pedem confirmação', async () => {
    const { element } = await render();
    controller.expectOne(CONSENT).flush(consent(true));
    await settle();
    controller.expectOne(LIST).flush(days);
    await settle();

    (
      element.querySelector('[aria-label="Ver foto de frente de 30/10/2026"]') as HTMLElement
    ).click();
    await settle();
    buttonWith(element, 'Apagar foto')!.click();
    await settle();
    controller.expectNone(`${LIST}/f2`);
    buttonWith(element, 'Apagar foto')!.click();
    controller.expectOne(`${LIST}/f2`).flush(null, { status: 204, statusText: 'No Content' });
    await settle();
    controller.expectOne((r) => r.url === LIST && r.method === 'GET').flush(days);
    await settle();

    buttonWith(element, 'Retirar consentimento')!.click();
    await settle();
    buttonWith(element, 'Retirar e apagar fotos')!.click();
    const revoke = controller.expectOne((r) => r.url === CONSENT && r.method === 'DELETE');
    revoke.flush(null, { status: 204, statusText: 'No Content' });
    await settle();
    controller.expectOne((r) => r.url === CONSENT && r.method === 'GET').flush(consent(false));
  });

  it('nutricionista: só vê, sem termo, envio ou exclusão', async () => {
    const { element } = await render('nutritionist');
    controller.expectNone(CONSENT);
    controller.expectOne('/api/v1/nutritionists/me/patients/p1/progress-photos').flush(days);
    await settle();

    expect(element.querySelectorAll('[aria-label^="Ver foto de"]').length).toBe(3);
    expect(buttonWith(element, 'Adicionar foto')).toBeUndefined();
    expect(element.querySelector('[aria-label^="Adicionar foto de"]')).toBeNull();
    expect(element.textContent).not.toContain('Retirar consentimento');
  });

  it('URL vencida: pede a lista de novo uma vez, sem entrar em laço', async () => {
    const { element } = await render('nutritionist');
    const url = '/api/v1/nutritionists/me/patients/p1/progress-photos';
    controller.expectOne(url).flush(days);
    await settle();

    const images = element.querySelectorAll('img');
    images[0].dispatchEvent(new Event('error'));
    images[1].dispatchEvent(new Event('error'));
    await settle();

    controller.expectOne(url).flush(days);
  });
});

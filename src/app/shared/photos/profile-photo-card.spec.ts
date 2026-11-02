import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ImageCropper } from './image-cropper';
import { ProfilePhotoCard } from './profile-photo-card';

@Component({
  imports: [ProfilePhotoCard],
  template: `
    <app-profile-photo-card
      name="Ana Souza"
      [photoUrl]="photoUrl()"
      path="/patients/me/photo"
      hint="Aparece para o seu nutricionista."
      (changed)="changes = changes + 1"
    />
  `,
})
class Host {
  readonly photoUrl = signal<string | null>(null);
  changes = 0;
}

describe('ProfilePhotoCard', () => {
  let controller: HttpTestingController;

  async function render(photoUrl: string | null) {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.photoUrl.set(photoUrl);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function choose(element: HTMLElement, file: File): void {
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
  }

  const buttonWith = (element: HTMLElement, text: string) =>
    [...element.querySelectorAll('button')].find((b) => b.textContent?.includes(text));

  afterEach(() => controller.verify());

  it('abre o ajuste do recorte e envia a foto recortada no campo "file"', async () => {
    // O recorte usa canvas, que o jsdom não tem: o E2E cobre o desenho de verdade.
    URL.createObjectURL = vi.fn(() => 'blob:original');
    URL.revokeObjectURL = vi.fn();
    const cropped = new File(['recorte'], 'eu.jpg', { type: 'image/jpeg' });
    vi.spyOn(ImageCropper.prototype, 'export').mockResolvedValue(cropped);

    const { fixture, element } = await render(null);
    expect(buttonWith(element, 'Enviar foto')).toBeTruthy();
    expect(buttonWith(element, 'Remover')).toBeUndefined();

    // Original grande (8 MB): passa, porque o que vai para a API é o recorte.
    choose(element, new File([new Uint8Array(8 * 1024 * 1024)], 'eu.jpg', { type: 'image/jpeg' }));
    await fixture.whenStable();
    expect(element.querySelector('[aria-roledescription="área de corte"]')).toBeTruthy();
    controller.expectNone('/api/v1/patients/me/photo');

    buttonWith(element, 'Salvar foto')!.click();
    await new Promise((resolve) => setTimeout(resolve));
    const request = controller.expectOne('/api/v1/patients/me/photo');
    expect(request.request.method).toBe('PUT');
    expect((request.request.body as FormData).get('file')).toBe(cropped);
    request.flush({ photoUrl: 'https://storage.test/eu.webp' });
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();

    expect(fixture.componentInstance.changes).toBe(1);
    expect(element.querySelector('[aria-roledescription="área de corte"]')).toBeNull();
  });

  it('não envia formato que a API recusa', async () => {
    const { element, fixture } = await render(null);
    choose(element, new File(['x'], 'eu.heic', { type: 'image/heic' }));
    await fixture.whenStable();

    controller.expectNone('/api/v1/patients/me/photo');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('JPEG, PNG ou WebP');
  });

  it('remove só depois de confirmar', async () => {
    const { fixture, element } = await render('https://storage.test/eu.webp');
    buttonWith(element, 'Remover')!.click();
    await fixture.whenStable();
    controller.expectNone('/api/v1/patients/me/photo');

    buttonWith(document.body, 'Remover foto')!.click();
    const request = controller.expectOne('/api/v1/patients/me/photo');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(fixture.componentInstance.changes).toBe(1);
  });
});

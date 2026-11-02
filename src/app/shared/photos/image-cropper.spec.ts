import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ImageCropper } from './image-cropper';

@Component({
  imports: [ImageCropper],
  template: `<app-image-cropper [file]="file" [aspect]="1" round />`,
})
class Host {
  readonly file = new File(['x'], 'eu.png', { type: 'image/png' });
}

describe('ImageCropper', () => {
  async function render() {
    URL.createObjectURL = vi.fn(() => 'blob:original');
    URL.revokeObjectURL = vi.fn();
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    // O jsdom não carrega imagens: simula uma foto de 400 × 300 que acabou de abrir.
    const image = element.querySelector('img')!;
    Object.defineProperty(image, 'naturalWidth', { value: 400 });
    Object.defineProperty(image, 'naturalHeight', { value: 300 });
    image.dispatchEvent(new Event('load'));
    await fixture.whenStable();
    return { fixture, element, image };
  }

  const area = (element: HTMLElement) =>
    element.querySelector<HTMLElement>('[aria-roledescription="área de corte"]')!;
  const zoom = (element: HTMLElement) =>
    element.querySelector<HTMLInputElement>('input[type="range"]')!;

  it('usa a URL do arquivo e a libera ao sair', async () => {
    const { fixture, image } = await render();
    expect(image.getAttribute('src')).toBe('blob:original');
    fixture.destroy();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:original');
  });

  it('zoom pelo teclado e pela barra, entre 100% e 400%', async () => {
    const { fixture, element } = await render();
    expect(zoom(element).getAttribute('aria-valuetext')).toBe('100%');

    area(element).dispatchEvent(new KeyboardEvent('keydown', { key: '+' }));
    await fixture.whenStable();
    expect(zoom(element).getAttribute('aria-valuetext')).toBe('110%');

    area(element).dispatchEvent(new KeyboardEvent('keydown', { key: '-' }));
    area(element).dispatchEvent(new KeyboardEvent('keydown', { key: '-' }));
    await fixture.whenStable();
    expect(zoom(element).getAttribute('aria-valuetext')).toBe('100%');

    zoom(element).value = '9';
    zoom(element).dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(zoom(element).getAttribute('aria-valuetext')).toBe('400%');
  });

  it('as setas movem a imagem, sem passar da borda', async () => {
    const { fixture, element, image } = await render();
    // Área sem medida no jsdom (1 × 1): com zoom 2 há folga para mover um pouco.
    zoom(element).value = '2';
    zoom(element).dispatchEvent(new Event('input'));
    for (let i = 0; i < 20; i++) {
      area(element).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    }
    await fixture.whenStable();

    const moved = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(image.style.transform)!;
    const x = Number(moved[1]);
    expect(x).toBeGreaterThan(0);
    // Escala de cobertura 1/300 × zoom 2 → imagem de 2,67 × 2: no máximo 0,83 px de folga.
    expect(x).toBeLessThanOrEqual(0.84);
  });
});

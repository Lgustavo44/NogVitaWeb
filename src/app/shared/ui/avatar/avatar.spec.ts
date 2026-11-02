import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Avatar } from './avatar';

@Component({
  imports: [Avatar],
  template: `<app-avatar [name]="name()" [photoUrl]="photoUrl()" size="lg" />`,
})
class Host {
  readonly name = signal('Ana Maria Souza');
  readonly photoUrl = signal<string | null>(null);
}

describe('Avatar', () => {
  async function render(photoUrl: string | null) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.photoUrl.set(photoUrl);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('sem foto, mostra as iniciais do primeiro e do último nome', async () => {
    const { element } = await render(null);
    expect(element.querySelector('img')).toBeNull();
    expect(element.textContent?.trim()).toBe('AS');
    expect(element.querySelector('app-avatar')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('com foto, mostra a imagem decorativa no tamanho pedido', async () => {
    const { element } = await render('https://storage.test/a.webp');
    const img = element.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('https://storage.test/a.webp');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('width')).toBe('56');
  });

  it('volta às iniciais se a imagem falhar e tenta de novo com uma URL nova', async () => {
    const { fixture, element } = await render('https://storage.test/expirada.webp');
    element.querySelector('img')!.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(element.querySelector('img')).toBeNull();
    expect(element.textContent?.trim()).toBe('AS');

    fixture.componentInstance.photoUrl.set('https://storage.test/nova.webp');
    await fixture.whenStable();
    expect(element.querySelector('img')?.getAttribute('src')).toBe(
      'https://storage.test/nova.webp',
    );
  });
});

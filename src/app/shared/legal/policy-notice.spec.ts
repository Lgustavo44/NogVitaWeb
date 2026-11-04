import { TestBed } from '@angular/core/testing';
import { POLICY_VERSION, PolicyNotice } from './policy-notice';

describe('PolicyNotice', () => {
  beforeEach(() => localStorage.clear());

  async function render() {
    const fixture = TestBed.createComponent(PolicyNotice);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('mostra o aviso com os links da política e dos termos até a pessoa dar "Entendi"', async () => {
    const { fixture, element } = await render();
    const links = [...element.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/legal/politica-de-privacidade.pdf', '/legal/termos-de-uso.pdf']);

    element.querySelector('button')!.click();
    await fixture.whenStable();

    expect(element.textContent?.trim()).toBe('');
    expect(localStorage.getItem('nv-policy-notice')).toBe(POLICY_VERSION);
  });

  it('não volta para quem já viu esta versão, e volta numa versão nova', async () => {
    localStorage.setItem('nv-policy-notice', POLICY_VERSION);
    expect((await render()).element.textContent?.trim()).toBe('');

    localStorage.setItem('nv-policy-notice', '2026-01-01');
    expect((await render()).element.textContent).toContain('Atualizamos a Política');
  });
});

import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from './button';

@Component({
  imports: [Button],
  template: `<button appButton type="button" [loading]="loading()">Salvar</button>`,
})
class Host {
  readonly loading = signal(false);
}

describe('Button', () => {
  it('fica desabilitado e marcado como ocupado durante o carregamento', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-busy')).toBeNull();

    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });
});

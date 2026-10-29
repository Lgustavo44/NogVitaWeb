import { TestBed } from '@angular/core/testing';
import { Alert } from './alert';

describe('Alert', () => {
  it('usa role="alert" para erro, para o leitor de tela anunciar na hora', async () => {
    const fixture = TestBed.createComponent(Alert);
    fixture.componentRef.setInput('tone', 'danger');
    await fixture.whenStable();

    expect(fixture.nativeElement.getAttribute('role')).toBe('alert');
  });

  it('usa role="status" para os outros tons', async () => {
    const fixture = TestBed.createComponent(Alert);
    fixture.componentRef.setInput('tone', 'info');
    fixture.componentRef.setInput('heading', 'Confirmação pendente');
    await fixture.whenStable();

    expect(fixture.nativeElement.getAttribute('role')).toBe('status');
    expect(fixture.nativeElement.textContent).toContain('Confirmação pendente');
  });
});

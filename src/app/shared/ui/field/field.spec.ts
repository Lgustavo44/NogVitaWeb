import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required } from '@angular/forms/signals';
import { Field } from './field';
import { FieldInput } from './field-input';

@Component({
  imports: [Field, FieldInput, FormField],
  template: `
    <app-field label="E-mail" [hint]="hint()">
      <input appInput [formField]="testForm.email" />
    </app-field>
  `,
})
class Host {
  readonly hint = signal<string | undefined>(undefined);
  readonly model = signal({ email: '' });
  readonly testForm = form(this.model, (path) => {
    required(path.email, { message: 'Informe seu e-mail.' });
  });
}

describe('Field', () => {
  it('liga o rótulo ao campo', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(label.htmlFor).toBe(input.id);
  });

  it('só mostra o erro depois que o campo é tocado, ligado por aria-describedby', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.getAttribute('aria-invalid')).toBeNull();

    fixture.componentInstance.testForm.email().markAsTouched();
    await fixture.whenStable();

    expect(input.getAttribute('aria-invalid')).toBe('true');
    const describedBy = input.getAttribute('aria-describedby');
    const error = fixture.nativeElement.querySelector(`#${describedBy}`) as HTMLElement;
    expect(error.textContent).toContain('Informe seu e-mail.');
  });

  it('liga a dica ao campo quando não há erro', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.hint.set('Use o e-mail do cadastro.');
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const hint = fixture.nativeElement.querySelector(
      `#${input.getAttribute('aria-describedby')}`,
    ) as HTMLElement;

    expect(hint.textContent).toContain('Use o e-mail do cadastro.');
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Toaster } from '../../../shared/ui/toast/toaster';
import { PatientProfileStore } from '../patient-profile-store';
import { PatientProfilePage } from './patient-profile';

@Component({
  imports: [PatientProfilePage],
  providers: [PatientProfileStore],
  template: `<app-patient-profile />`,
})
class Host {}

const PROFILE = {
  userId: 'u1',
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
  cpf: '529.982.247-25',
  birthDate: '1994-03-10',
  age: 32,
  biologicalSex: 'Female',
  heightInCm: 165,
  goal: 'WeightLoss',
  wakeUpTime: '06:30:00',
  bedTime: '22:30:00',
  trainingTime: null,
};

describe('PatientProfilePage', () => {
  let fixture: ComponentFixture<Host>;
  let element: HTMLElement;
  let controller: HttpTestingController;

  /** Sem whenStable: com requisições abertas (httpResource, envio do form) ele esperaria para sempre. */
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Host);
    element = fixture.nativeElement;
    // O httpResource só dispara a requisição depois do primeiro ciclo de detecção.
    TestBed.tick();
    controller.expectOne('/api/v1/patients/me').flush(PROFILE);
    await settle();
  });

  afterEach(() => controller.verify());

  function setInput(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submit(): void {
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  it('mostra nome, e-mail e CPF só para leitura', () => {
    expect(element.textContent).toContain('Ana Souza');
    expect(element.textContent).toContain('529.982.247-25');
    expect(element.querySelector('input[type="email"]')).toBeNull();
  });

  it('começa sem alterações: "Salvar" desabilitado', () => {
    const save = [...element.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Salvar'),
    )!;

    expect(save.disabled).toBe(true);
  });

  it('salva enviando os três horários (o vazio vai como null, senão a API apagaria)', async () => {
    const toaster = TestBed.inject(Toaster);
    setInput('input[type="number"]', '170');
    await settle();
    submit();
    await settle();

    const request = controller.expectOne('/api/v1/patients/me');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      birthDate: '1994-03-10',
      heightInCm: 170,
      biologicalSex: 'Female',
      goal: 'WeightLoss',
      wakeUpTime: '06:30',
      bedTime: '22:30',
      trainingTime: null,
    });
    request.flush(null);
    await settle();
    controller.expectOne('/api/v1/patients/me').flush({ ...PROFILE, heightInCm: 170 });

    expect(toaster.toasts().map((toast) => toast.message)).toContain('Perfil salvo.');
  });

  it('não deixa salvar com o mesmo horário para acordar e dormir', async () => {
    const [wake, bed] = element.querySelectorAll<HTMLInputElement>('input[type="time"]');
    wake.value = '07:00';
    wake.dispatchEvent(new Event('input'));
    bed.value = '07:00';
    bed.dispatchEvent(new Event('input'));
    await settle();
    submit();
    await settle();

    controller.expectNone('/api/v1/patients/me');
    expect(element.textContent).toContain('não pode ser igual ao de acordar');
  });

  it('troca o objetivo e "Descartar" volta ao valor salvo', async () => {
    const maintenance = element.querySelector<HTMLInputElement>(
      'input[name="goal"][value="Maintenance"]',
    )!;
    maintenance.click();
    await settle();
    expect(element.textContent).toContain('alterações que ainda não foram salvas');

    [...element.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Descartar'))!
      .click();
    await settle();

    expect(
      element.querySelector<HTMLInputElement>('input[name="goal"][value="WeightLoss"]')!.checked,
    ).toBe(true);
    expect(element.textContent).toContain('Tudo salvo.');
  });
});

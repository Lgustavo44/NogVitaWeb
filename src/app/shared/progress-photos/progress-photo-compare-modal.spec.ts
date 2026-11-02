import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Component, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProgressPhotoCompareModal } from './progress-photo-compare-modal';
import { ProgressPhotoDay } from './progress-photos.models';

const days: ProgressPhotoDay[] = [
  {
    takenOn: '2026-10-30',
    photos: [{ id: 'f3', takenOn: '2026-10-30', angle: 'Front', url: 'https://s.test/f3.webp' }],
  },
  {
    takenOn: '2026-10-15',
    photos: [{ id: 's2', takenOn: '2026-10-15', angle: 'Side', url: 'https://s.test/s2.webp' }],
  },
  {
    takenOn: '2026-09-30',
    photos: [{ id: 'f1', takenOn: '2026-09-30', angle: 'Front', url: 'https://s.test/f1.webp' }],
  },
];

@Component({
  imports: [ProgressPhotoCompareModal],
  template: `
    <app-progress-photo-compare-modal
      [days]="days"
      weightRecordsPath="/nutritionists/me/patients/p1/weight-records"
    />
  `,
})
class Host {
  readonly days = days;
}

registerLocaleData(localePt);

describe('ProgressPhotoCompareModal', () => {
  it('compara a data mais antiga com a mais recente do ângulo, com o peso de cada dia', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    });
    const controller = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Host);
    TestBed.tick();
    const element = fixture.nativeElement as HTMLElement;

    const weights = controller.expectOne(
      (r) => r.url === '/api/v1/nutritionists/me/patients/p1/weight-records',
    );
    expect(weights.request.params.get('from')).toBe('2026-09-30');
    weights.flush({
      items: [
        { id: 'w1', recordedOn: '2026-09-30', weightKg: 82.4, notes: null },
        { id: 'w2', recordedOn: '2026-10-29', weightKg: 80, notes: null },
      ],
      page: 1,
      pageSize: 100,
      totalItems: 2,
      totalPages: 1,
    });
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();

    const images = [...element.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(images).toEqual(['https://s.test/f1.webp', 'https://s.test/f3.webp']);
    expect(element.textContent).toContain('82,4 kg');
    expect(element.textContent).toContain('Sem peso no dia');
    expect(element.textContent).toContain('+30 dias');

    // "Lado" só tem uma data: não dá para comparar.
    const side = [...element.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Lado'),
    );
    expect(side?.disabled).toBe(true);
    controller.verify();
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AreaChoice } from './area-choice';

describe('AreaChoice', () => {
  let controller: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    controller = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  async function settle(fixture: { whenStable: () => Promise<unknown> }) {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  it('com um papel só, vai direto para a área', async () => {
    const fixture = TestBed.createComponent(AreaChoice);
    controller.expectOne('/api/v1/auth/me').flush({ userId: 'u1', roles: ['Nutritionist'] });
    await settle(fixture);

    expect(navigate).toHaveBeenCalledWith('/nutricionista', { replaceUrl: true });
  });

  it('com mais de um papel, mostra a escolha com um link por área', async () => {
    const fixture = TestBed.createComponent(AreaChoice);
    controller
      .expectOne('/api/v1/auth/me')
      .flush({ userId: 'u1', roles: ['Patient', 'Nutritionist'] });
    await settle(fixture);

    const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll('a')].map((link) =>
      link.getAttribute('href'),
    );
    expect(navigate).not.toHaveBeenCalled();
    expect(links).toEqual(['/paciente', '/nutricionista']);
  });
});

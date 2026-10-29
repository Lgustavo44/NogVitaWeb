import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  afterEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  it('aplica a escolha no <html> e lembra dela', () => {
    const theme = TestBed.inject(ThemeService);

    theme.setPreference('dark');
    TestBed.tick();

    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('nv-theme')).toBe('dark');
  });

  it('começa pela escolha salva', () => {
    localStorage.setItem('nv-theme', 'light');

    const theme = TestBed.inject(ThemeService);

    expect(theme.preference()).toBe('light');
    expect(theme.resolved()).toBe('light');
  });
});

import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/http/auth.interceptor';
import { serverWakeInterceptor } from './core/http/server-wake';
import { ThemeService } from './core/theme/theme.service';

// Datas e números no formato brasileiro (DatePipe, DecimalPipe).
registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, serverWakeInterceptor])),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    // Aplica o tema (data-theme no <html>) antes da primeira tela.
    provideAppInitializer(() => {
      inject(ThemeService);
    }),
  ],
};

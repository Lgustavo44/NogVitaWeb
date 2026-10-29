import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/http/auth.interceptor';
import { serverWakeInterceptor } from './core/http/server-wake';
import { ThemeService } from './core/theme/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, serverWakeInterceptor])),
    // Aplica o tema (data-theme no <html>) antes da primeira tela.
    provideAppInitializer(() => {
      inject(ThemeService);
    }),
  ],
};

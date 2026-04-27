import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

/**
 * Defines the global Angular application providers.
 */
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)]
};

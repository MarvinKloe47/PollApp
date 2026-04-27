import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * Bootstraps the Angular application in the browser.
 */
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => {
    throw err;
  });

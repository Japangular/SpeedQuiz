import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {INJECTED_QUIZ_API} from './interfaces/SubmissionDeckApi';
import {provideHttpClient} from '@angular/common/http';
import {BASE_PATH} from './api';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), INJECTED_QUIZ_API, provideHttpClient(), {
    provide: BASE_PATH,
    useValue: 'http://localhost:8080'
  }]
};

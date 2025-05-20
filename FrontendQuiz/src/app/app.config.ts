import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {INJECTED_QUIZ_API} from './interfaces/SubmissionDeckApi';
import {HTTP_INTERCEPTORS, provideHttpClient} from '@angular/common/http';
import {BASE_PATH} from './api';
import {LoggerInterceptor} from './interceptor/LoggerInterceptor';
import {environment} from './environments/environment';
import {INJECTED_DECK_CHOOSER} from './services/card-store.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    INJECTED_QUIZ_API,
    INJECTED_DECK_CHOOSER,
    provideHttpClient(),
    {
      provide: BASE_PATH,
      useValue: environment.apiBaseUrl
    },
    {
      provide: HTTP_INTERCEPTORS,  // Register the interceptor for all HTTP requests
      useClass: LoggerInterceptor,
      multi: true  // Ensures that this interceptor is added to the chain of interceptors
    }
  ]
};

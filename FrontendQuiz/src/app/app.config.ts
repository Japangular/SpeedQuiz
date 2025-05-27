import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {INJECTED_QUIZ_API} from './interfaces/SubmissionDeckApi';
import {HTTP_INTERCEPTORS, provideHttpClient} from '@angular/common/http';
import {LoggerInterceptor} from './interceptor/LoggerInterceptor';
import {environment} from './environments/environment';
import {BASE_PATH} from '../generated/api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    INJECTED_QUIZ_API,
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

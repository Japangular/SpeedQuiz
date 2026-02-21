import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {INJECTED_QUIZ_API} from './interfaces/SubmissionDeckApi';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {LoggerInterceptor} from './interceptor/LoggerInterceptor';
import {environment} from './environments/environment';
import {BASE_PATH} from '../generated/api';
import {INJECTED_QUIZ_BACKEND_API} from './interfaces/QuizApi';
import {TokenInterceptorService} from './user-store-management/token-interceptor.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    INJECTED_QUIZ_API,
    INJECTED_QUIZ_BACKEND_API,
    // withInterceptorsFromDi() is required for class-based HTTP_INTERCEPTORS
    // to work with the standalone provideHttpClient() API
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: BASE_PATH,
      useValue: environment.apiBaseUrl
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoggerInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptorService,
      multi: true
    },
  ]
};

// src/app/api/services/quiz-api.interface.ts

import {Observable} from 'rxjs';
import {InjectionToken} from '@angular/core';
import {DefaultService, SubmissionDeck} from '../api';

export interface QuizApi {
  submissionDeckPost(deck: SubmissionDeck): Observable<any>;
}

export const QUIZ_API_TOKEN = new InjectionToken<QuizApi>('QUIZ_API');

export const INJECTED_QUIZ_API = {
  provide: QUIZ_API_TOKEN, useClass: DefaultService
};

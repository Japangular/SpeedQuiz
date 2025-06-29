// src/app/api/services/quiz-api.interface.ts

import {Observable} from 'rxjs';
import {InjectionToken} from '@angular/core';
import {DeckMetadata, DefaultService, SubmissionDeck} from '../../generated/api';

export interface QuizApi {
  quizApiSubmissionDeckGet(username: string, deckName: string): Observable<SubmissionDeck>;
  quizApiSubmissionDeckPost(deck: SubmissionDeck): Observable<any>;
  quizApiAvailableDecksGet(username: string): Observable<DeckMetadata[]>;
}

export const QUIZ_API_TOKEN = new InjectionToken<QuizApi>('QUIZ_API');

export const INJECTED_QUIZ_API = {
  provide: QUIZ_API_TOKEN, useClass: DefaultService
};

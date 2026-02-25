import {Observable} from 'rxjs';
import {InjectionToken} from '@angular/core';
import {DeckMetadata, SubmissionDeck} from '../../generated/api';
import {QuizBackendApiService} from '../services/quiz-backend-api.service';

export interface QuizBackendApi {
  submissionDeckGet(username: string, deckName: string): Observable<SubmissionDeck>;
  submissionDeckPost(deck: SubmissionDeck): Observable<any>;
  availableDecksGet(username: string): Observable<DeckMetadata[]>;
}

export const QUIZ_API_TOKEN = new InjectionToken<QuizBackendApi>('QUIZ_BACKEND_API');

export const INJECTED_QUIZ_BACKEND_API = {
  provide: QUIZ_API_TOKEN, useClass: QuizBackendApiService
};

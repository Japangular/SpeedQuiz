import {Inject, Injectable, InjectionToken} from '@angular/core';
import {QUIZ_API_TOKEN, QuizApi} from '../interfaces/SubmissionDeckApi';
import { Observable } from 'rxjs';
import {DeckMetadata} from '../../generated/api';

@Injectable({
  providedIn: 'root'
})
export class DeckApiService implements DeckApi {
  username =  "app initializer";

  constructor(@Inject(QUIZ_API_TOKEN) private quizApi: QuizApi) {
  }

  availableDecksGet(): Observable<DeckMetadata[]> {
    return this.quizApi.quizApiAvailableDecksGet(this.username);
  }
}

export interface DeckApi {
  availableDecksGet(): Observable<DeckMetadata[]>;
}

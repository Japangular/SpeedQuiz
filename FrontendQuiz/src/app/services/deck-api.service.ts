import {Inject, Injectable} from '@angular/core';
import {QUIZ_API_TOKEN, QuizApi} from '../interfaces/SubmissionDeckApi';
import {Observable, of} from 'rxjs';
import {DeckInfo, DeckMetadata} from '../models/deck.model';
import {PropertyType} from '../features/dynamic-card-creator/submission-deck.model';

@Injectable({
  providedIn: 'root'
})
export class DeckApiService implements DeckApi {
  username =  "app initializer";

  constructor(@Inject(QUIZ_API_TOKEN) private quizApi: QuizApi) {
  }

  decks: DeckMetadata[] = [
    {deckName: 'First Deck', properties: {Frage: PropertyType.Question, Antwort: PropertyType.Answer}, username: this.username},
    {deckName: 'Second Deck', properties: {Term: PropertyType.Question, Definition: PropertyType.Answer}, username: this.username}
  ];

  availableDecksGet(): Observable<DeckMetadata[]> {
    return of(this.decks);
  }
}

export interface DeckApi {
  availableDecksGet(): Observable<DeckMetadata[]>;
}

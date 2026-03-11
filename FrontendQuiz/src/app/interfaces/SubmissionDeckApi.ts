import {Observable} from 'rxjs';
import {InjectionToken} from '@angular/core';
import {DeckInfo, DeckContent, DeckPage, DeckCardState} from '../models/deck.model';
import {QuizApiService} from '../services/quiz-api.service';

export interface QuizApi {
  listDecks(): Observable<DeckInfo[]>;
  loadDeck(deckId: string): Observable<DeckContent>;
  browseDeck(deckId: string, limit?: number, offset?: number, filter?: string): Observable<DeckPage>;
  createDeck(deckName: string, content: DeckContent): Observable<any>;
  getCardStates(deckId: string): Observable<DeckCardState[]>;
  updateCardStates(deckId: string, states: DeckCardState[]): Observable<any>;
}

export const QUIZ_API_TOKEN = new InjectionToken<QuizApi>('QUIZ_API');
export const INJECTED_QUIZ_API = {
  provide: QUIZ_API_TOKEN, useClass: QuizApiService
};

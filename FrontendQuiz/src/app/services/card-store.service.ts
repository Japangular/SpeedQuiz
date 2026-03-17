import {Inject, Injectable} from '@angular/core';
import {QUIZ_API_TOKEN} from '../interfaces/QuizApi';
import {BehaviorSubject, Observable} from 'rxjs';
import {UserGeneratedDeck, UserGeneratedDeckSubmissionService} from '../features/dynamic-card-creator/submission-deck.model';
import {PropertyType, DeckContent} from '../models/deck.model';
import {map} from 'rxjs/operators';
import {DeckItem} from '../features/deck-table/deck/deck-table.model';
import {QuizApi} from '../interfaces/SubmissionDeckApi';

export interface HeaderTable {
  deckItems: DeckItem[],
  displayedColumns: string[]
}

@Injectable({
  providedIn: 'root'
})
export class CardStoreService implements UserGeneratedDeckSubmissionService {
  currentDeckName = "initial Deck";
  currentDeckId: string | undefined;
  currentDeck: DeckContent = {properties: {}, cards: []};
  _currentDeck: BehaviorSubject<DeckContent> = new BehaviorSubject(this.currentDeck);
  _currentDeck$: Observable<DeckContent> = this._currentDeck.asObservable();

  constructor(@Inject(QUIZ_API_TOKEN) private quizApi: QuizApi) {
  }

  sendCurrentDeck() {
    this.quizApi.createDeck(this.currentDeckName, this.currentDeck).subscribe(a => console.log(a));
  }

  setCurrentDeck(deck: DeckContent | DeckItem[], deckName?: string, deckId?: string) {
    this.currentDeckId = deckId;

    if (Array.isArray(deck)) {
      this.currentDeckName = deckName ?? "DeckDataSource";
      this.currentDeck = {
        properties: {position: PropertyType.Question, name: PropertyType.Answer},
        cards: deck.map(item => ({
          position: item['id'],
          name: item['name']
        }))
      };
    } else {
      this.currentDeckName = deckName ?? this.currentDeckName;
      this.currentDeck = deck;
    }

    console.log(JSON.stringify(deck));
    this._currentDeck.next(this.currentDeck);
  }

  sendUserGeneratedDeck(deck: UserGeneratedDeck): void {
    this.currentDeckName = deck.deckName ?? "no-name";
    this.setCurrentDeck({properties: deck.properties, cards: deck.cards});
    this.sendCurrentDeck();
  }

  switchDeck(deckId: string): Observable<HeaderTable>  {
    return this.quizApi.loadDeck(deckId).pipe(
      map(deck => mapDeckContentToDeckItem(deck))
    );
  }
}

export function mapDeckContentToDeckItem(deckContent: DeckContent): HeaderTable {
  const displayedColumns = Object.keys(deckContent.properties);
  const deckItems: DeckItem[] = deckContent.cards.map((card: Record<string, string>) => {
    const item: DeckItem = {};
    displayedColumns.forEach(key => {
      item[key] = card[key] ?? '';
    });
    return item;
  });

  return {deckItems, displayedColumns};
}



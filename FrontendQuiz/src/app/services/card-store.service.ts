import {Inject, Injectable} from '@angular/core';
import {QUIZ_API_TOKEN, QuizApi} from '../interfaces/SubmissionDeckApi';
import {BehaviorSubject, Observable} from 'rxjs';
import {DeckItem} from '../features/deck/deck-datasource';
import {
  UserGeneratedDeck,
  UserGeneratedDeckSubmissionService
} from '../features/dynamic-card-creator/submission-deck.model';
import {PropertyType, SubmissionDeck} from '../../generated/api';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CardStoreService implements UserGeneratedDeckSubmissionService {
  currentDeck = {deckName: "initial Deck", username: "app initializer", properties: {}, cards: []} as SubmissionDeck;
  _currentDeck: BehaviorSubject<SubmissionDeck> = new BehaviorSubject(this.currentDeck);
  _currentDeck$: Observable<SubmissionDeck> = this._currentDeck.asObservable();

  constructor(@Inject(QUIZ_API_TOKEN) private quizApi: QuizApi) {
  }

  sendCurrentDeck(){
    this.quizApi.submissionDeckPost(this.currentDeck).subscribe(a => console.log(a));
  }

  setCurrentDeck(deck: SubmissionDeck | DeckItem[]) {
    if (Array.isArray(deck)) {
      const current = this.currentDeck;
      current.deckName = "DeckDataSource";
      current.properties = {position: PropertyType.Question, name: PropertyType.Answer};
      current.cards = deck.map(item => ({
        position: item['id'],
        name: item['name']
      }));
    } else {
      this.currentDeck = deck;
    }

    console.log(JSON.stringify(deck))

    this._currentDeck.next(this.currentDeck);
  }

  sendUserGeneratedDeck(deck: UserGeneratedDeck): void {
    this.setCurrentDeck(deck);
    this.sendCurrentDeck();
  }

  switchDeck(deckName: string): Observable<{ deckItems: DeckItem[], displayedColumns: string[] }> {
    return this.quizApi.submissionDeckGet(this.currentDeck.username, deckName).pipe(
      map(deck => mapSubmissionDeckToDeckItem(deck))
    );
  }
}

export function mapSubmissionDeckToDeckItem(submissionDeck: SubmissionDeck): {
  deckItems: DeckItem[],
  displayedColumns: string[]
} {
  console.log("goal map submissionDeck: " + JSON.stringify(submissionDeck));
  const displayedColumns = Object.keys(submissionDeck.properties);
  const deckItems: DeckItem[] = submissionDeck.cards.map(card => {
    const item: DeckItem = {};
    displayedColumns.forEach(key => {
      item[key] = card[key] ?? ''; // fallback to empty string
    });
    return item;
  });

  return {deckItems, displayedColumns};
}

export function mapUserGeneratedDeckToSubmissionDeck(deck: UserGeneratedDeck, username: string): SubmissionDeck {
  return {
    deckName: deck.deckName,
    username: deck.username ?? username,
    properties: deck.properties,
    cards: deck.cards
  };
}

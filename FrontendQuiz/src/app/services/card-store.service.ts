import {Inject, Injectable} from '@angular/core';
import {INJECTED_QUIZ_API, QUIZ_API_TOKEN, QuizApi} from '../interfaces/SubmissionDeckApi';
import {BehaviorSubject, Observable} from 'rxjs';
import {PropertyType, SubmissionDeck} from '../api';
import {DeckDataSource, DeckItem} from '../features/deck/deck-datasource';

@Injectable({
  providedIn: 'root'
})
export class CardStoreService {
  currentDeck = {deckName: "initial Deck", username: "app initializer", properties: {}, cards: []} as SubmissionDeck;
  _currentDeck: BehaviorSubject<SubmissionDeck> = new BehaviorSubject(this.currentDeck);
  _currentDeck$: Observable<SubmissionDeck> = this._currentDeck.asObservable();

  constructor(@Inject(QUIZ_API_TOKEN) private quizApi: QuizApi) { }

  sendCurrentDeck(){
    this.quizApi.submissionDeckPost(this.currentDeck);
  }

  setCurrentDeck(deck: SubmissionDeck | DeckItem[]) {
    if (Array.isArray(deck)) {
      const current = this.currentDeck;
      current.deckName = "DeckDataSource";
      current.properties = {position: PropertyType.Question, name: PropertyType.Answer};
      current.cards = deck.map(item => ({
        position: item.id.toString(),
        name: item.name
      }));
    } else {
      this.currentDeck = deck;
    }

    console.log(JSON.stringify(deck))

    this._currentDeck.next(this.currentDeck);
  }

  get currentDeck$(): Observable<SubmissionDeck>{
    return this._currentDeck$;
  }
}

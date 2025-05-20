import {Inject, Injectable} from '@angular/core';
import {QUIZ_API_TOKEN, QuizApi} from '../interfaces/SubmissionDeckApi';
import {BehaviorSubject, Observable} from 'rxjs';
import {PropertyType, SubmissionDeck} from '../api';
import {DeckDataSource, DeckItem} from '../features/deck/deck-datasource';
import {
  DECK_CHOOSER_TOKEN, DeckChooser, DeckMetadata,
  UserGeneratedDeck,
  UserGeneratedDeckSubmissionService
} from '../features/dynamic-card-creator/submission-deck.model';

@Injectable({
  providedIn: 'root'
})
export class CardStoreService implements UserGeneratedDeckSubmissionService, DeckChooser {
  currentDeck = {deckName: "initial Deck", username: "app initializer", properties: {}, cards: []} as SubmissionDeck;
  _currentDeck: BehaviorSubject<SubmissionDeck> = new BehaviorSubject(this.currentDeck);
  _currentDeck$: Observable<SubmissionDeck> = this._currentDeck.asObservable();

  constructor(@Inject(QUIZ_API_TOKEN) private quizApi: QuizApi) {
  }

  deckMetadata(): Observable<DeckMetadata[]> {
        throw new Error('Method not implemented.');
    }

  getDeckMetadata(): DeckMetadata[] {
    return [
      {name: "german deck", properties: {Frage: PropertyType.Question, Antwort: PropertyType.Answer}},
      {name: "english Deck", properties: {Question: PropertyType.Question, Answer: PropertyType.Answer}}] as DeckMetadata[];
  }

  sendSelectedDeckMetadata(deckMetadata: DeckMetadata): void {
    console.log("selected deck was " + JSON.stringify(deckMetadata));
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

  sendUserGeneratedDeck(deck: UserGeneratedDeck): void {
    this.setCurrentDeck(mapUserGeneratedDeckToSubmissionDeck(deck, this.currentDeck.username));
    this.sendCurrentDeck();
  }
}

export function mapUserGeneratedDeckToSubmissionDeck(deck: UserGeneratedDeck, username: string): SubmissionDeck {
  return {
    deckName: deck.name,
    username: username, // You would pass in the username here
    properties: deck.properties,
    cards: deck.cards.map(card => {
      return {
        [card.name]: card.value
      };
    })
  };
}

export const INJECTED_DECK_CHOOSER = {provide: DECK_CHOOSER_TOKEN, useClass: CardStoreService};

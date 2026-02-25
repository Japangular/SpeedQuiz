import {Card, mapDeck} from '../../answer-slots/quiz.model';
import {Observable, ReplaySubject} from 'rxjs';
import {SubmissionDeck} from '../../../../../generated/api';
import {ModalService} from '../../../../widgets/modal/modal.service';
import {DECK_ITERATOR_EXAMPLE_CARDS, DeckCommand} from './deck-iterator.model';

export class DeckIterator implements DeckCommand {
  private cardSubject: ReplaySubject<Card> = new ReplaySubject<Card>(1);
  private card$: Observable<Card> = this.cardSubject.asObservable();

  private index: number = 0;
  private startPos: number = 0;
  private deck: Card[];

  constructor(private deck$: Observable<SubmissionDeck>, private modalService: ModalService, startPos?: number) {
    this.deck = DECK_ITERATOR_EXAMPLE_CARDS;
    this.startPos = startPos && startPos < this.deck.length ? startPos : 0;
    this.cardSubject.next(this.deck[this.startPos]);
    deck$.subscribe(deck => {
      //if(deck.deckName === "initial Deck" && deck.username === "app initializer") return;
      this.deck = mapDeck(deck)
      this.reset();
    });
  }

  initialCard(): Card {
    return DECK_ITERATOR_EXAMPLE_CARDS[0];
  }

  getDeckCommand(): DeckCommand {
    return this;
  }

  proceed(withoutHelp?: boolean) {
    if (withoutHelp === false) {
      this.useHint();
    }
    this.nextCard();
  }

  useHint(): void {
    this.index = this.startPos;
  }

  setAsStartPoint(): void {
    this.startPos = this.index;
  }

  getCard$(): Observable<Card> {
    return this.card$;
  }

  nextCard(): void {
    if (this.index < this.deck.length - 1){
      this.index++;
    } else {
      this.modalService.openDeckCompletedModal(this.deck).subscribe(result => {
        if (result === 'restart') {
          // Handle restart action
          console.log('Restarting...');
          this.index = this.startPos;
        } else if (result === 'goToAnki') {
          // Handle go to Anki action
          console.log('Going to Anki...');
        } else {
          // Handle case when result is undefined
          console.log('No action taken');
          this.index = this.startPos;
        }
      });
    }
    this.current;
  }

  previousCard(): void {
    throw new Error('Method not implemented.');
  }

  toggleCardType(cardType?: string): void {
    throw new Error('Method not implemented.');
  }

  get current(): Card {
    const card = this.deck[this.index];
    this.cardSubject.next(card);
    return card;
  }

  next(): void {
    if (this.index < this.deck.length - 1) this.index++;
    this.current;
  }

  jumpTo(predicate: (card: Card) => boolean): void {
    const idx = this.deck.findIndex(predicate);
    if (idx >= 0) {
      this.index = idx;
    }
    this.current;
  }

  reset(): void {
    this.index = 0;
    this.startPos = 0;
    this.current;
  }

}

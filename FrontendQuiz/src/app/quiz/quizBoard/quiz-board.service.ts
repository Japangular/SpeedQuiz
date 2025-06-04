import {Injectable} from '@angular/core';
import {Observable, ReplaySubject} from 'rxjs';
import {Card} from '../dualInputCard/quiz.model';
import {DeckIterator} from '../utils/deck-iterator/DeckIterator';

@Injectable({
  providedIn: 'root'
})
export class QuizBoardService {
  private cardSubject: ReplaySubject<Card> = new ReplaySubject<Card>(1);
  card$: Observable<Card> = this.cardSubject.asObservable();

  private deckIterator = new DeckIterator();

  constructor() {
    this.getCard();
  }

  getCard() {
    this.cardSubject.next(this.deckIterator.getCard());
  }

  nextCard(withoutHelp?: boolean) {
    if (withoutHelp === false) {
      this.deckIterator.useHint();
    }
    this.deckIterator.nextCard();
  }

  useHint() {
    this.deckIterator.useHint();
    this.nextCard();
  }

  setAsStartPoint() {
    this.deckIterator.setAsStartPoint();
    this.nextCard();
  }

  toggleCardType(cardType?: string) {
    this.deckIterator.toggleCardType(cardType);
    this.deckIterator.nextCard();
  }

  jumpTo(jumpKey: string) {
    const type = detectJumpKeyType(jumpKey);

    this.deckIterator.jumpTo(card  => {
      switch (type) {
        case 'index':
          return card.index === parseInt(jumpKey);
        case 'reading':
          return card.reading === jumpKey;
        case 'meaning':
          return card.meaning.toLowerCase() === jumpKey.toLowerCase();
        default:
          return false;
      }
    });
  }
}

type JumpKeyType = 'index' | 'meaning' | 'reading' | 'unknown';

function detectJumpKeyType(input: string): JumpKeyType {
  if (/^\d+$/.test(input)) return 'index';
  if (/^[\u3040-\u309F]+$/.test(input)) return 'reading';
  if (/^[A-Za-z]+$/.test(input)) return 'meaning';
  return 'unknown';
}

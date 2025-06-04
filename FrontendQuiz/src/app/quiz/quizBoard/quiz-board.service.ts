import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Card} from '../dualInputCard/quiz.model';
import {DeckCommand, DeckIterator} from '../utils/deck-iterator/DeckIterator';

@Injectable({
  providedIn: 'root'
})
export class QuizBoardService {
  card$: Observable<Card>;

  private deckIterator = new DeckIterator();

  constructor() {
    this.card$ = this.deckIterator.getCard$();
  }

  getDeckCommand(): DeckCommand {
    return this.deckIterator;
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

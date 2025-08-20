import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Card} from '../answer-slots/quiz.model';
import {DeckCommand, DeckIterator} from '../utils/deck-iterator/DeckIterator';
import {CardStoreService} from '../../../services/card-store.service';
import {ModalService} from '../widget/modal/modal.service';

@Injectable({
  providedIn: 'root'
})
export class QuizBoardService {
  card$: Observable<Card>;

  private readonly deckIterator: DeckIterator ;

  constructor(private store: CardStoreService, private modal: ModalService) {
    this.deckIterator = new DeckIterator(store._currentDeck$);
    this.card$ = this.deckIterator.getCard$();
  }

  openHintModal(card: Card){
    this.modal.openHintModal(card);
  }

  getDeckCommand(): DeckCommand {
    return this.deckIterator;
  }

  nextCard(withoutHelp?: boolean) {
    this.deckIterator.proceed(withoutHelp);
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
          return card.answers['reading'] === jumpKey;
        case 'meaning':
          return card.answers['meaning'].toLowerCase() === jumpKey.toLowerCase();
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

import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Card} from '../answer-slots/quiz.model';
import {DeckIterator} from '../utils/deck-iterator/deck-iterator';
import {CardStoreService} from '../../../services/card-store.service';
import {AnkiCard} from '../../anki-table/anki-table.model';
import {PropertyType} from '../../../../generated/api';
import {ModalService} from '../../../widgets/modal/modal.service';
import {DeckCommand} from '../utils/deck-iterator/deck-iterator.model';
import {SubmissionDeck} from '../../../models/deck.model';

@Injectable({
  providedIn: 'root'
})
export class QuizBoardService {
  card$: Observable<Card>;

  private readonly deckIterator: DeckIterator ;

  constructor(private store: CardStoreService, private modal: ModalService) {
    this.deckIterator = new DeckIterator(store._currentDeck$, modal);
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

  learnSelected(ankiCards: AnkiCard[]){
    if (!ankiCards || ankiCards.length == 0)
      return;

    const cards = ankiCards.map(card => ({
      index: card.index,
      question: card.question,
      reading: card.reading,
      meaning: card.meaning,
      hint: [card.index, card.question, card.reading, card.meaning].join(" : "),
    }));
    const deck = {
      deckName: "SelectedAnkiDeck",
      username: "ankiUser",
      properties: {
        index: PropertyType.Info,
        question: PropertyType.Question,
        reading: PropertyType.Answer,
        meaning: PropertyType.Answer,
        hint: PropertyType.Hint
      },
      cards: cards,
    } as SubmissionDeck;

    this.store.setCurrentDeck(deck);
  }
}

type JumpKeyType = 'index' | 'meaning' | 'reading' | 'unknown';

function detectJumpKeyType(input: string): JumpKeyType {
  if (/^\d+$/.test(input)) return 'index';
  if (/^[\u3040-\u309F]+$/.test(input)) return 'reading';
  if (/^[A-Za-z]+$/.test(input)) return 'meaning';
  return 'unknown';
}

import {Observable} from 'rxjs';
import {Card} from '../../model/quiz.model';

export interface DeckCommand {
  initialCard(): Card;
  getCard$(): Observable<Card>;
  proceed(withoutHelp?: boolean): void;
  nextCard(): void;
  previousCard(): void;
  useHint(): void;
  setAsStartPoint(): void;
  toggleCardType(cardType?: string): void;
  jumpTo(predicate: (card: Card) => boolean): void;
}

export interface DeckState {
  getCard$(): Observable<Card>;
}

export const DECK_ITERATOR_EXAMPLE_CARDS = [
  {
    index: 0,
    level: 1,
    subjectType: 'vocab',
    question: '火',
    answers: {
      reading: 'ひ',
      meaning: 'fire'
    },
    info: 'Represents fire or flame.',
    hint: 'Think of a campfire.',
    subjectId: 1001
  },
  {
    index: 1,
    level: 1,
    subjectType: 'vocab',
    question: '水',
    answers: {
      reading: 'みず',
      meaning: 'water'
    },
    info: 'Used in words like 水曜日 (Wednesday).',
    hint: 'Looks like flowing water.',
    subjectId: 1002
  }
];

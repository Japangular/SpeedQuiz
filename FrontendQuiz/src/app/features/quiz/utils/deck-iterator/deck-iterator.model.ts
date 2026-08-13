import {Observable} from 'rxjs';
import {Card} from '../../model/quiz.model';
import {RewindRule} from '../quiz-session/rewind';

export interface DeckCommand {
  initialCard(): Card;
  getCard$(): Observable<Card>;
  deckCompleted$: Observable<void>;

  /** The user answered the current card. */
  proceed(withoutHelp?: boolean, exact?: boolean): void;
  useHint(): void;

  nextCard(): void;
  previousCard(): void;
  restart(): void;
  jumpTo(predicate: (card: Card) => boolean): void;

  /** Save point. `setAsStartPoint` keeps its old name; callers already use it. */
  setAsStartPoint(): void;
  clearStartPoint(): void;
  getAnchor(): number;
  hasSavePoint(): boolean;

  setRewindRule(rule: RewindRule): void;

  toggleCardType(cardType?: string): void;
}

export const DECK_ITERATOR_EXAMPLE_CARDS: Card[] = [
  {
    index: 0,
    level: 1,
    subjectType: 'vocab',
    question: '火',
    answers: {
      reading: 'ひ',
      meaning: 'fire',
    },
    info: 'Represents fire or flame.',
    hint: 'Think of a campfire.',
    subjectId: 1001,
  },
  {
    index: 1,
    level: 1,
    subjectType: 'vocab',
    question: '水',
    answers: {
      reading: 'みず',
      meaning: 'water',
    },
    info: 'Used in words like 水曜日 (Wednesday).',
    hint: 'Looks like flowing water.',
    subjectId: 1002,
  },
];

import {Card} from '../../dualInputCard/quiz.model';
import {Observable, ReplaySubject} from 'rxjs';

export class DeckIterator implements CardHandler {
  private cardSubject: ReplaySubject<Card> = new ReplaySubject<Card>(1);
  private card$: Observable<Card> = this.cardSubject.asObservable();

  private index: number = 0;
  private startPos: number = 0;
  private deck: Card[];

  constructor() {
    this.deck = EXAMPLE_CARDS;
  }

  useHint(): void {
    this.index = this.startPos;
  }

  setAsStartPoint(): void {
    this.startPos = this.index;
  }

  getCard(): Card {
    return this.current;
  }

  getCard$(): Observable<Card> {
    return this.card$;
  }

  nextCard(): Card {
    if (this.index < this.deck.length - 1){
      this.index++;
    } else {
      this.index = this.startPos;
    }
    return this.current;
  }

  previousCard(): Card {
    throw new Error('Method not implemented.');
  }

  toggleCardType(cardType?: string): Card {
    throw new Error('Method not implemented.');
  }

  get current(): Card {
    const card = this.deck[this.index];
    this.cardSubject.next(card);
    return card;
  }

  next(): Card {
    if (this.index < this.deck.length - 1) this.index++;
    return this.current;
  }

  jumpTo(predicate: (card: Card) => boolean): Card {
    const idx = this.deck.findIndex(predicate);
    if (idx >= 0) {
      this.index = idx;
    }
    return this.current;
  }

  reset(): void {
    this.index = 0;
    this.startPos = 0;
  }

}

export interface CardHandler {
  getCard(): Card;

  nextCard(): Card;

  previousCard(): Card;

  useHint(): void;

  setAsStartPoint(): void;

  toggleCardType(cardType?: string): Card;

  jumpTo(predicate: (card: Card) => boolean): Card;
}

const EXAMPLE_CARDS = [
  {
    index: 0,
    level: 1,
    subjectType: 'vocab',
    question: '火',
    reading: 'ひ',
    meaning: 'fire',
    info: 'Represents fire or flame.',
    hint: 'Think of a campfire.',
    subjectId: 1001
  },
  {
    index: 1,
    level: 1,
    subjectType: 'vocab',
    question: '水',
    reading: 'みず',
    meaning: 'water',
    info: 'Used in words like 水曜日 (Wednesday).',
    hint: 'Looks like flowing water.',
    subjectId: 1002
  },
  {
    index: 2,
    level: 1,
    subjectType: 'vocab',
    question: '土',
    reading: 'つち',
    meaning: 'earth, soil',
    info: 'Represents ground or dirt.',
    hint: 'Used in 土曜日 (Saturday).',
    subjectId: 1003
  },
  {
    index: 3,
    level: 1,
    subjectType: 'vocab',
    question: '風',
    reading: 'かぜ',
    meaning: 'wind',
    info: 'Can also mean "cold" depending on context.',
    hint: 'Think of breezy air.',
    subjectId: 1004
  },
  {
    index: 4,
    level: 1,
    subjectType: 'vocab',
    question: '空',
    reading: 'そら',
    meaning: 'sky, empty',
    info: 'Also means "empty" depending on kanji reading.',
    hint: 'Sky with nothing in it.',
    subjectId: 1005
  },
  {
    index: 5,
    level: 1,
    subjectType: 'vocab',
    question: '木',
    reading: 'き',
    meaning: 'tree, wood',
    info: 'Used in 木曜日 (Thursday).',
    hint: 'Looks like a tree with branches.',
    subjectId: 1006
  },
  {
    index: 6,
    level: 1,
    subjectType: 'vocab',
    question: '金',
    reading: 'きん',
    meaning: 'gold, money',
    info: 'Used in 金曜日 (Friday).',
    hint: 'Think of shiny metal.',
    subjectId: 1007
  },
  {
    index: 7,
    level: 1,
    subjectType: 'vocab',
    question: '山',
    reading: 'やま',
    meaning: 'mountain',
    info: 'Shape resembles mountain peaks.',
    hint: 'Used in 富士山 (Mount Fuji).',
    subjectId: 1008
  },
  {
    index: 8,
    level: 1,
    subjectType: 'vocab',
    question: '川',
    reading: 'かわ',
    meaning: 'river',
    info: 'Symbolizes a flowing river.',
    hint: 'Looks like three river lines.',
    subjectId: 1009
  },
  {
    index: 9,
    level: 1,
    subjectType: 'vocab',
    question: '雨',
    reading: 'あめ',
    meaning: 'rain',
    info: 'Used in 雨天 (rainy weather).',
    hint: 'Raindrops falling from a cloud.',
    subjectId: 1010
  }
];

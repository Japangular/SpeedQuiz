import {Card} from '../../answer-slots/quiz.model';

export interface SortStrategy {
  readonly name: string;
  sort(cards: Card[]): Card[];
}

export class ByIndexStrategy implements SortStrategy {
  readonly name = 'byIndex';

  sort(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => a.index - b.index);
  }
}

export class ByHiraganaStrategy implements SortStrategy {
  readonly name = 'byHiragana';

  sort(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => {
      const aReading = a.answers['reading'] ?? a.answers['hiragana'] ?? a.question;
      const bReading = b.answers['reading'] ?? b.answers['hiragana'] ?? b.question;
      return aReading.localeCompare(bReading, 'ja');
    });
  }
}

export class RandomStrategy implements SortStrategy {
  readonly name = 'random';

  sort(cards: Card[]): Card[] {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export class WeakCardsFirstStrategy implements SortStrategy {
  readonly name = 'weakCardsFirst';

  constructor(
    private getHintUsed: (cardIndex: number) => boolean,
    private getSolvedWithoutHint: (cardIndex: number) => boolean
  ) {}

  sort(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => {
      const aScore = this.priorityScore(a.index);
      const bScore = this.priorityScore(b.index);
      return bScore - aScore; // higher score = needs more practice = comes first
    });
  }

  private priorityScore(index: number): number {
    let score = 0;
    if (this.getHintUsed(index)) score += 2;
    if (!this.getSolvedWithoutHint(index)) score += 1;
    return score;
  }
}

export type SortStrategyName = 'byIndex' | 'byHiragana' | 'random' | 'weakCardsFirst';

export function createSortStrategy(name: SortStrategyName): SortStrategy {
  switch (name) {
    case 'byIndex':
      return new ByIndexStrategy();
    case 'byHiragana':
      return new ByHiraganaStrategy();
    case 'random':
      return new RandomStrategy();
    default:
      throw new Error(`Unknown sort strategy: ${name}. 'weakCardsFirst' requires session data — construct it directly.`);
  }
}

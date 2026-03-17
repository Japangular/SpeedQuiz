export interface HintStrategy {
  readonly name: string;

  computeResumeIndex(currentIndex: number, startPos: number, deckLength: number): number;
}

export class BackToFirstStrategy implements HintStrategy {
  readonly name = 'backToFirst';

  computeResumeIndex(_currentIndex: number, startPos: number, _deckLength: number): number {
    return startPos;
  }
}

export class BackNCardsStrategy implements HintStrategy {
  readonly name = 'backNCards';

  constructor(private n: number = 3) {}

  computeResumeIndex(currentIndex: number, startPos: number, _deckLength: number): number {
    return Math.max(startPos, currentIndex - this.n);
  }
}

export class NoRewindStrategy implements HintStrategy {
  readonly name = 'noRewind';

  computeResumeIndex(currentIndex: number, _startPos: number, _deckLength: number): number {
    // Stay on the same card — proceed() will advance by 1 as normal
    return currentIndex;
  }
}

export class ReinsertLaterStrategy implements HintStrategy {
  readonly name = 'reinsertLater';

  computeResumeIndex(currentIndex: number, _startPos: number, _deckLength: number): number {
    return currentIndex;
  }
}

export type HintStrategyName = 'backToFirst' | 'backNCards' | 'noRewind' | 'reinsertLater';

export function createHintStrategy(name: HintStrategyName, params?: { n?: number }): HintStrategy {
  switch (name) {
    case 'backToFirst':
      return new BackToFirstStrategy();
    case 'backNCards':
      return new BackNCardsStrategy(params?.n ?? 3);
    case 'noRewind':
      return new NoRewindStrategy();
    case 'reinsertLater':
      return new ReinsertLaterStrategy();
    default:
      throw new Error(`Unknown hint strategy: ${name}`);
  }
}

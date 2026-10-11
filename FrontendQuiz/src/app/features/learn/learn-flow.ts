import {Deck} from '../quiz/utils/quiz-session/deck';

/**
 * What learn mode does after the last card of a level.
 *
 *   toDeckEnd    carry on into the next level, through to the end of the deck
 *   repeatLevel  back to the first card of the same level
 *
 * Levels are the quiz's level blocks (Deck.blocks), so "level" means the same
 * thing in both modes. In a deck without levels only toDeckEnd applies.
 */
export type LearnFlow = 'toDeckEnd' | 'repeatLevel';

export const LEARN_FLOWS: readonly LearnFlow[] = ['toDeckEnd', 'repeatLevel'];

export const DEFAULT_LEARN_FLOW: LearnFlow = 'toDeckEnd';

export function isLearnFlow(value: unknown): value is LearnFlow {
  return typeof value === 'string' && (LEARN_FLOWS as readonly string[]).includes(value);
}

export function learnFlowLabel(flow: LearnFlow): string {
  switch (flow) {
    case 'toDeckEnd':   return 'Continue to deck end';
    case 'repeatLevel': return 'Repeat level';
  }
}

/** Pure. The index after `index`; `deck.length` means the end of the deck was reached. */
export function nextLearnIndex(deck: Deck, index: number, flow: LearnFlow): number {
  if (index < 0 || index >= deck.length) return deck.length;

  if (flow === 'repeatLevel' && deck.hasLevels) {
    const block = deck.blockAt(index);
    if (index === block.end) return block.start;
  }
  return index + 1;
}

import {Card} from '../../model/quiz.model';
import {cardUid} from './card-uid';

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
  ) {
  }

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

// ── card order (deck bar → "Card order") ────────────────────────────────────

/**
 * How the deck is laid out for a run.
 *
 *   original         the order the deck was authored in
 *   shuffledFixed    shuffled once; the same shuffled order on every run until
 *                    the user asks for a new one ("Shuffle again")
 *   shuffledEachRun  a new shuffle whenever a run starts (restart after
 *                    finishing the deck, reset progress)
 *
 * Both shuffled modes are the same mechanism — a seeded shuffle — and differ
 * only in when the seed is replaced. The seed travels with the session state,
 * so a reload (or another device) lands in the same order mid-run instead of
 * reshuffling under the user's feet.
 */
export type CardOrderMode = 'original' | 'shuffledFixed' | 'shuffledEachRun';

export const CARD_ORDER_MODES: readonly CardOrderMode[] = ['original', 'shuffledFixed', 'shuffledEachRun'];

export const DEFAULT_CARD_ORDER: CardOrderMode = 'original';

export function isCardOrderMode(value: unknown): value is CardOrderMode {
  return typeof value === 'string' && (CARD_ORDER_MODES as readonly string[]).includes(value);
}

export function cardOrderLabel(mode: CardOrderMode): string {
  switch (mode) {
    case 'original':        return 'Original order';
    case 'shuffledFixed':   return 'Shuffled once, then fixed';
    case 'shuffledEachRun': return 'Reshuffled every run';
  }
}

export function cardOrderIcon(mode: CardOrderMode): string {
  switch (mode) {
    case 'original':        return 'format_list_numbered';
    case 'shuffledFixed':   return 'shuffle';
    case 'shuffledEachRun': return 'casino';
  }
}

/** A fresh 32-bit seed. Never 0, so "no seed yet" and "seed" cannot be confused. */
export function newOrderSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) + 1) >>> 0;
}

/**
 * Deterministic shuffle: the same seed and the same cards always give the same
 * order.
 *
 * Each card gets a sort key hashed from (seed, uid), rather than the deck being
 * run through Fisher-Yates. The difference shows when a deck changes: with
 * per-card keys, appending or removing a row leaves every other card's relative
 * order untouched, whereas a positional shuffle would rearrange the whole deck.
 *
 * `index` is rewritten to the card's POSITION in the new order. Identity lives
 * in `uid` (progress, cursor and save point are all keyed on it), while `index`
 * is what the history sidebar compares to tell "before" from "after" — so it
 * has to follow the order the user is actually playing.
 */
export class SeededShuffleStrategy implements SortStrategy {
  readonly name = 'seededShuffle';

  constructor(private readonly seed: number) {
  }

  sort(cards: Card[]): Card[] {
    return cards
      .map(card => ({
        card,
        key: seededKey(this.seed, card.uid ?? cardUid(card.question, card.answers)),
      }))
      // Ties only happen for genuine duplicate rows; original index keeps them stable.
      .sort((a, b) => a.key - b.key || a.card.index - b.card.index)
      .map(({card}, position) => ({...card, index: position}));
  }
}

/** `seed` is ignored for 'original', and required for the shuffled modes. */
export function strategyForOrder(mode: CardOrderMode, seed: number | undefined): SortStrategy {
  if (mode === 'original' || seed === undefined) return new ByIndexStrategy();
  return new SeededShuffleStrategy(seed);
}

/** FNV-1a over the uid, seeded, then murmur3's finaliser to spread similar uids apart. */
function seededKey(seed: number, uid: string): number {
  let h = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < uid.length; i++) {
    h ^= uid.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

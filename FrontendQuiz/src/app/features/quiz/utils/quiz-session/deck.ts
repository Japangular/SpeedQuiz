import {Card} from '../../model/quiz.model';
import {cardUid} from './card-uid';

/**
 * A contiguous run of cards sharing the same `level`, in the deck's CURRENT
 * (post-sort) order.
 *
 * Contiguity is the definition on purpose. Under ByIndexStrategy levels form
 * clean blocks and this is exactly what the user sees. Under RandomStrategy
 * every block collapses to length 1, which makes level-based rewinding
 * degrade into "no rewind" — the safe failure, rather than hurling the user
 * to some unrelated card that happens to share a level number.
 */
export interface LevelBlock {
  readonly level: number;
  /** First index of the block, inclusive. */
  readonly start: number;
  /** Last index of the block, inclusive. */
  readonly end: number;
  /** 0-based position of this block among all blocks. */
  readonly ordinal: number;
}

/**
 * The deck in its current order, plus everything derived from it that used to
 * be recomputed ad hoc: level blocks, stable ids, uid lookup.
 *
 * Immutable. Re-sorting or re-importing means calling buildDeck() again.
 */
export interface Deck {
  readonly cards: readonly Card[];
  readonly uids: readonly string[];
  readonly blocks: readonly LevelBlock[];
  readonly length: number;

  /**
   * False when every card sits in its own block — either the deck has no
   * Level column (mapDeck falls back to `index`, making every level unique)
   * or the sort has scattered them. UI should hide level affordances when
   * this is false rather than showing something meaningless.
   */
  readonly hasLevels: boolean;

  uidAt(index: number): string;
  levelAt(index: number): number;
  blockAt(index: number): LevelBlock;
  /** -1 when absent. */
  indexOfUid(uid: string): number;
}

interface MutableBlock {
  level: number;
  start: number;
  end: number;
  ordinal: number;
}

export function buildDeck(cards: readonly Card[]): Deck {
  const list: readonly Card[] = [...cards];

  // ── stable ids, with duplicates disambiguated ──────────────────────────
  // Real decks do contain genuine duplicate rows. Suffixing keeps every card
  // addressable and keeps the mapping deterministic for a given deck order.
  const uids: string[] = [];
  const seen = new Map<string, number>();
  for (const card of list) {
    const base =
      card.uid && card.uid.length > 0
        ? card.uid
        : cardUid(card.question, card.answers);
    const previous = seen.get(base) ?? 0;
    seen.set(base, previous + 1);
    uids.push(previous === 0 ? base : `${base}~${previous}`);
  }

  const byUid = new Map<string, number>();
  uids.forEach((uid, index) => byUid.set(uid, index));

  // ── level blocks, single pass ──────────────────────────────────────────
  const blocks: MutableBlock[] = [];
  const blockOf: number[] = new Array<number>(list.length);

  for (let i = 0; i < list.length; i++) {
    const level = list[i].level;
    const current = blocks[blocks.length - 1];

    if (current !== undefined && current.level === level) {
      current.end = i;
    } else {
      blocks.push({level, start: i, end: i, ordinal: blocks.length});
    }
    blockOf[i] = blocks.length - 1;
  }

  const frozenBlocks: readonly LevelBlock[] = blocks.map(b => Object.freeze({...b}));
  const hasLevels = list.length > 0 && frozenBlocks.length < list.length;

  const clampIndex = (index: number): number => {
    if (list.length === 0) return -1;
    if (index < 0) return 0;
    if (index >= list.length) return list.length - 1;
    return index;
  };

  return {
    cards: list,
    uids,
    blocks: frozenBlocks,
    length: list.length,
    hasLevels,

    uidAt(index: number): string {
      const i = clampIndex(index);
      return i < 0 ? '' : uids[i];
    },

    levelAt(index: number): number {
      const i = clampIndex(index);
      return i < 0 ? 0 : list[i].level;
    },

    blockAt(index: number): LevelBlock {
      const i = clampIndex(index);
      if (i < 0) return {level: 0, start: 0, end: 0, ordinal: 0};
      return frozenBlocks[blockOf[i]];
    },

    indexOfUid(uid: string): number {
      return byUid.get(uid) ?? -1;
    },
  };
}

export const EMPTY_DECK: Deck = buildDeck([]);

import {Deck} from './deck';

/**
 * Where the deck resumes after the user answers a card they took a hint on.
 *
 * This replaces hint-strategy.ts. The four classes there covered two axes at
 * once (where to resume, and whether to mutate the deck), which is why
 * `reinsertLater` leaked an `instanceof` check back into DeckIterator and why
 * `noRewind` and `reinsertLater` had identical bodies.
 *
 *   toAnchor      back to the anchor — deck start by default, or wherever the
 *                 user dropped a save point via setAsStartPoint()
 *   toLevelStart  back to the first card of the current level block,
 *                 but never past the anchor
 *   none          carry on; the hint costs nothing
 *
 * "Back to deck start" and "back to save point" are the same rule against a
 * movable anchor, not two rules. The anchor already existed as `startPos`;
 * it just had no UI.
 */
export type RewindRule = 'toAnchor' | 'toLevelStart' | 'none';

export const REWIND_RULES: readonly RewindRule[] = ['toAnchor', 'toLevelStart', 'none'];

export const DEFAULT_REWIND_RULE: RewindRule = 'toAnchor';

export function isRewindRule(value: unknown): value is RewindRule {
  return typeof value === 'string' && (REWIND_RULES as readonly string[]).includes(value);
}

export interface RewindContext {
  /** Index of the card just answered. */
  readonly cursor: number;
  /** Save point, or 0 for deck start. Always a floor: never rewind past it. */
  readonly anchor: number;
}

/**
 * Pure. Returns the index to resume from.
 *
 * A return value equal to `cursor` means "nothing to rewind to" — the caller
 * should advance normally. That is what makes `none` behave as its name
 * promises, and it is also the correct answer for `toLevelStart` when the
 * user is already on the first card of the level.
 */
export function resumeIndex(ctx: RewindContext, deck: Deck, rule: RewindRule): number {
  if (deck.length === 0) return 0;

  const cursor = clamp(ctx.cursor, 0, deck.length - 1);
  const anchor = clamp(ctx.anchor, 0, cursor);

  switch (rule) {
    case 'none':
      return cursor;

    case 'toAnchor':
      return anchor;

    case 'toLevelStart':
      // Math.max is what makes a save point dropped mid-level win over the
      // level boundary — the user put the marker there deliberately.
      return Math.max(anchor, deck.blockAt(cursor).start);

    default:
      return cursor;
  }
}

/**
 * UI label. `toAnchor` reads differently depending on whether a save point
 * has actually been placed, which is the whole point of folding two of the
 * user's three cases into one rule.
 */
export function rewindLabel(rule: RewindRule, hasSavePoint: boolean): string {
  switch (rule) {
    case 'toAnchor':
      return hasSavePoint ? 'Back to save point' : 'Back to deck start';
    case 'toLevelStart':
      return 'Back to start of level';
    case 'none':
      return 'Stay on this card';
  }
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

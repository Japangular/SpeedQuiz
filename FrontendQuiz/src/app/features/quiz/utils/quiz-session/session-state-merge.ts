import {PersistedCardState, PersistedSessionState, SESSION_STATE_VERSION} from './quiz-session';
import type {StampedSessionState} from './session-sync.service';

/**
 * Combines two session states for the same deck.
 *
 * Why a merge rather than "newest state wins wholesale": studying happens on
 * more than one deployment, and a state blob is not atomic — it is a bag of
 * per-card records that were each written at a different moment. Taking one
 * blob entire would discard everything the other side learned, even cards the
 * loser touched more recently.
 *
 * The rule is per card: whichever side saw that card last wins that card.
 * The cursor and anchor come from whichever blob was saved later, since those
 * describe where you were sitting rather than what you know.
 *
 * This makes the merge commutative in the cards and direction-independent
 * overall, which is the property that matters: pasting a stale export cannot
 * roll back progress made since, and pasting a fresh one cannot lose progress
 * made elsewhere.
 */

/**
 * When a card record has no solvedAt — seen or hinted but never answered — fall
 * back to when its blob was written. Zero last, so a record with no timestamp
 * at all never beats one that has one.
 */
function seenAt(entry: PersistedCardState, blobSavedAt: number): number {
  return entry.solvedAt ?? blobSavedAt;
}

export function mergeSessionStates(
  base: StampedSessionState | undefined,
  incoming: StampedSessionState,
): StampedSessionState {
  if (!base) return incoming;

  // A state hashed under a different uid scheme cannot be reconciled card by
  // card, so the merge is not attempted. Callers decide what to do with that;
  // returning the newer blob whole is the least surprising fallback.
  if (base.version !== SESSION_STATE_VERSION || incoming.version !== SESSION_STATE_VERSION) {
    return (incoming.savedAt ?? 0) >= (base.savedAt ?? 0) ? incoming : base;
  }

  const baseSavedAt = base.savedAt ?? 0;
  const incomingSavedAt = incoming.savedAt ?? 0;

  const merged = new Map<string, PersistedCardState>();

  for (const entry of base.cards ?? []) {
    merged.set(entry.uid, entry);
  }

  for (const entry of incoming.cards ?? []) {
    const existing = merged.get(entry.uid);
    if (!existing) {
      merged.set(entry.uid, entry);
      continue;
    }
    // The whole record moves together. Taking max(attempts) alongside the
    // other side's solvedAt would invent a card history that never happened.
    if (seenAt(entry, incomingSavedAt) > seenAt(existing, baseSavedAt)) {
      merged.set(entry.uid, entry);
    }
  }

  const newer = incomingSavedAt >= baseSavedAt ? incoming : base;

  return {
    version: SESSION_STATE_VERSION,
    cursorUid: newer.cursorUid,
    anchorUid: newer.anchorUid,
    hintUsedHere: newer.hintUsedHere,
    cards: [...merged.values()],
    savedAt: Math.max(baseSavedAt, incomingSavedAt),
  };
}

/** What a merge would do, for showing the user before they commit to it. */
export interface MergePreview {
  cardsHere: number;
  cardsIncoming: number;
  cardsAfter: number;
  /** Cards the incoming state knows about that this deployment has never seen. */
  cardsGained: number;
  /** Cards where the incoming record is the more recent one. */
  cardsUpdated: number;
  studiedHereAt?: number;
  studiedIncomingAt?: number;
  /** True when the local copy is the fresher one — worth saying out loud. */
  incomingIsOlder: boolean;
}

export function previewMerge(
  base: StampedSessionState | undefined,
  incoming: StampedSessionState,
): MergePreview {
  const baseCards = new Map((base?.cards ?? []).map(c => [c.uid, c]));
  const baseSavedAt = base?.savedAt ?? 0;
  const incomingSavedAt = incoming.savedAt ?? 0;

  let gained = 0;
  let updated = 0;

  for (const entry of incoming.cards ?? []) {
    const existing = baseCards.get(entry.uid);
    if (!existing) {
      gained++;
    } else if (seenAt(entry, incomingSavedAt) > seenAt(existing, baseSavedAt)) {
      updated++;
    }
  }

  return {
    cardsHere: baseCards.size,
    cardsIncoming: incoming.cards?.length ?? 0,
    cardsAfter: baseCards.size + gained,
    cardsGained: gained,
    cardsUpdated: updated,
    studiedHereAt: base?.savedAt,
    studiedIncomingAt: incoming.savedAt,
    incomingIsOlder: baseSavedAt > 0 && incomingSavedAt > 0 && incomingSavedAt < baseSavedAt,
  };
}

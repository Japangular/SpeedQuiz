import {mergeSessionStates, previewMerge} from './session-state-merge';
import {PersistedCardState, SESSION_STATE_VERSION} from './quiz-session';
import type {StampedSessionState} from './session-sync.service';

function card(uid: string, solvedAt?: number, attempts = 1): PersistedCardState {
  return {uid, hintUsed: false, attempts, solvedWithoutHint: true, solvedAt};
}

function state(
  savedAt: number,
  cards: PersistedCardState[],
  cursorUid: string | null = null,
): StampedSessionState {
  return {
    version: SESSION_STATE_VERSION,
    cursorUid,
    anchorUid: null,
    hintUsedHere: false,
    cards,
    savedAt,
  };
}

describe('mergeSessionStates', () => {

  it('returns the incoming state when there is nothing to merge into', () => {
    const incoming = state(1000, [card('a', 900)]);
    expect(mergeSessionStates(undefined, incoming)).toBe(incoming);
  });

  it('keeps cards only one side knows about', () => {
    const base = state(1000, [card('a', 900)]);
    const incoming = state(2000, [card('b', 1900)]);

    const merged = mergeSessionStates(base, incoming);
    expect(merged.cards.map(c => c.uid).sort()).toEqual(['a', 'b']);
  });

  it('takes the more recently solved record for a shared card', () => {
    const base = state(3000, [card('a', 2900, 5)]);
    const incoming = state(1000, [card('a', 900, 1)]);

    const merged = mergeSessionStates(base, incoming);
    expect(merged.cards[0].solvedAt).toBe(2900);
    expect(merged.cards[0].attempts).toBe(5);
  });

  it('does not roll back progress when a stale export is pasted', () => {
    // The case that motivated the merge: learned on prod yesterday, then
    // pasted a week-old dev export.
    const onProd = state(9_000, [card('a', 8_900), card('b', 8_950)]);
    const oldExport = state(1_000, [card('a', 900)]);

    const merged = mergeSessionStates(onProd, oldExport);
    expect(merged.cards.find(c => c.uid === 'a')!.solvedAt).toBe(8_900);
    expect(merged.cards.find(c => c.uid === 'b')).toBeDefined();
  });

  it('is order-independent for the card set', () => {
    const left = state(1000, [card('a', 900), card('b', 950)]);
    const right = state(2000, [card('b', 1950), card('c', 1900)]);

    const a = mergeSessionStates(left, right);
    const b = mergeSessionStates(right, left);

    expect(a.cards.map(c => c.uid).sort()).toEqual(b.cards.map(c => c.uid).sort());
    expect(a.cards.find(c => c.uid === 'b')!.solvedAt)
      .toBe(b.cards.find(c => c.uid === 'b')!.solvedAt);
  });

  it('takes the cursor from whichever blob was saved later', () => {
    const older = state(1000, [card('a', 900)], 'a');
    const newer = state(2000, [card('b', 1900)], 'b');

    expect(mergeSessionStates(older, newer).cursorUid).toBe('b');
    expect(mergeSessionStates(newer, older).cursorUid).toBe('b');
  });

  it('falls back to the blob timestamp for a card that was never solved', () => {
    // Seen and hinted but not answered: no solvedAt of its own.
    const base = state(1000, [{uid: 'a', hintUsed: true, attempts: 0, solvedWithoutHint: false}]);
    const incoming = state(5000, [{uid: 'a', hintUsed: false, attempts: 3, solvedWithoutHint: true}]);

    const merged = mergeSessionStates(base, incoming);
    expect(merged.cards[0].attempts).toBe(3);
  });

  it('carries the later savedAt forward so the next merge compares correctly', () => {
    const merged = mergeSessionStates(state(1000, []), state(7000, []));
    expect(merged.savedAt).toBe(7000);
  });

  it('does not attempt a card-level merge across state versions', () => {
    const base = {...state(9000, [card('a', 8900)]), version: 1};
    const incoming = state(1000, [card('b', 900)]);

    // v1 keyed on position, so its uids are meaningless here. The newer blob
    // wins whole rather than producing a mixture of two schemes.
    expect(mergeSessionStates(base, incoming).cards.map(c => c.uid)).toEqual(['a']);
  });
});

describe('mergeSessionStates after a reset', () => {
  const resetAt = (s: StampedSessionState, at: number): StampedSessionState => ({...s, resetAt: at});
  const uids = (s: StampedSessionState) => s.cards.map(c => c.uid).sort();

  it('drops what the side that missed the reset learned before it', () => {
    const afterReset = resetAt(state(5_000, [card('a', 4_500)]), 4_000);
    const missedIt = state(3_000, [card('b', 2_000), card('c', 2_500)]);

    expect(uids(mergeSessionStates(missedIt, afterReset))).toEqual(['a']);
    expect(uids(mergeSessionStates(afterReset, missedIt))).toEqual(['a']);
  });

  it('keeps answers given after the reset, even from the side that missed it', () => {
    // Desktop reset at 4000; the phone was offline and kept studying.
    const afterReset = resetAt(state(4_000, []), 4_000);
    const offlinePhone = state(6_000, [card('b', 3_000), card('c', 4_500)]);

    expect(uids(mergeSessionStates(afterReset, offlinePhone))).toEqual(['c']);
  });

  it('drops an unanswered record from the side that missed the reset', () => {
    // No solvedAt, so nothing says it came after the reset, even though its
    // blob was saved after it.
    const afterReset = resetAt(state(4_000, []), 4_000);
    const missedIt = state(6_000, [{uid: 'h', hintUsed: true, attempts: 0, solvedWithoutHint: false}]);

    expect(uids(mergeSessionStates(afterReset, missedIt))).toEqual([]);
  });

  it('keeps every record of the side that carries the reset, however old', () => {
    // An import that replaced progress: old answers, installed at 9000.
    const imported = resetAt(state(9_000, [card('a', 1_000, 4), card('b', 1_500)]), 9_000);
    const elsewhere = state(8_000, [card('a', 7_000, 1), card('c', 7_500)]);

    for (const merged of [mergeSessionStates(imported, elsewhere), mergeSessionStates(elsewhere, imported)]) {
      expect(uids(merged)).toEqual(['a', 'b']);
      expect(merged.cards.find(c => c.uid === 'a')!.attempts).toBe(4);
    }
  });

  it('merges as usual between two sides that both saw the reset', () => {
    const left = resetAt(state(5_000, [card('a', 4_500)]), 4_000);
    const right = resetAt(state(6_000, [card('b', 5_500)]), 4_000);

    expect(uids(mergeSessionStates(left, right))).toEqual(['a', 'b']);
  });

  it('carries the latest reset forward, and adds none where there was none', () => {
    expect(mergeSessionStates(resetAt(state(1_000, []), 900), resetAt(state(2_000, []), 1_900)).resetAt)
      .toBe(1_900);
    expect(mergeSessionStates(state(1_000, []), state(2_000, [])).resetAt).toBeUndefined();
  });
});

describe('previewMerge', () => {

  it('counts what would be gained and what would be updated', () => {
    const base = state(1000, [card('a', 900), card('b', 950)]);
    const incoming = state(5000, [card('a', 4900), card('c', 4950)]);

    const preview = previewMerge(base, incoming);
    expect(preview.cardsHere).toBe(2);
    expect(preview.cardsIncoming).toBe(2);
    expect(preview.cardsGained).toBe(1);     // c
    expect(preview.cardsUpdated).toBe(1);    // a
    expect(preview.cardsAfter).toBe(3);
  });

  it('flags an incoming state that is older than what is already here', () => {
    expect(previewMerge(state(9000, []), state(1000, [])).incomingIsOlder).toBe(true);
    expect(previewMerge(state(1000, []), state(9000, [])).incomingIsOlder).toBe(false);
  });

  it('does not flag staleness when there is nothing to compare against', () => {
    expect(previewMerge(undefined, state(1000, [])).incomingIsOlder).toBe(false);
  });
});

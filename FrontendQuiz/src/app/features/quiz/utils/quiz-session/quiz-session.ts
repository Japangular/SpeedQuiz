import {BehaviorSubject, Observable} from 'rxjs';
import {Card} from '../../model/quiz.model';
import {buildDeck, Deck} from './deck';

export interface CardSessionEntry {
  card: Card;
  /** Stable identity — survives sorting and re-import. */
  uid: string;
  hintUsed: boolean;
  attempts: number;
  solvedWithoutHint: boolean;
  solvedExactly?: boolean;
  solvedAt?: number;
  lastSeenAt?: number;
}

export interface PersistedCardState {
  uid: string;
  hintUsed: boolean;
  attempts: number;
  solvedWithoutHint: boolean;
  solvedExactly?: boolean;
  solvedAt?: number;
}

/**
 * Bumped from the implicit v1. The old shape keyed progress on `cardIndex`,
 * which was the position in the POST-SORT array — so saved progress belonged
 * to whatever ordering happened to be active when it was written. v1 payloads
 * are discarded on load rather than misapplied.
 */
export const SESSION_STATE_VERSION = 2;

export interface PersistedSessionState {
  version: number;
  /** null means deck start. */
  cursorUid: string | null;
  /** null means no save point (anchor sits at deck start). */
  anchorUid: string | null;
  /** Whether a hint was taken on the current visit to the cursor card. */
  hintUsedHere: boolean;
  /** Level values already rewound to, when rewindOncePerLevel is in effect. */
  rewoundLevels: number[];
  cards: PersistedCardState[];
}

/**
 * Owns the deck plus everything that must survive a reload: per-card progress,
 * the cursor, the anchor, and the current-visit hint flag.
 *
 * DeckIterator drives it; SessionSyncService serialises it.
 */
export class QuizSession {
  readonly deck: Deck;

  private readonly entries: CardSessionEntry[];
  private readonly byUid = new Map<string, CardSessionEntry>();

  private _cursor = 0;
  private _anchor = 0;
  private _hintUsedHere = false;
  private _rewoundLevels = new Set<number>();

  private _restoredCursor?: number;
  private _restoredAnchor?: number;

  private _dirty$ = new BehaviorSubject<boolean>(false);
  dirty$: Observable<boolean> = this._dirty$.asObservable();

  constructor(cards: readonly Card[], priorState?: PersistedSessionState) {
    this.deck = buildDeck(cards);

    this.entries = this.deck.cards.map((card, i) => {
      const entry: CardSessionEntry = {
        card,
        uid: this.deck.uidAt(i),
        hintUsed: false,
        attempts: 0,
        solvedWithoutHint: false,
      };
      this.byUid.set(entry.uid, entry);
      return entry;
    });

    if (priorState) {
      this.restore(priorState);
    }
  }

  // ── deck ────────────────────────────────────────────────────────────────

  get length(): number {
    return this.entries.length;
  }

  getEntry(index: number): CardSessionEntry {
    return this.entries[index];
  }

  getCard(index: number): Card {
    return this.entries[index].card;
  }

  getAllEntries(): readonly CardSessionEntry[] {
    return this.entries;
  }

  getEntryByUid(uid: string): CardSessionEntry | undefined {
    return this.byUid.get(uid);
  }

  // ── restored position ───────────────────────────────────────────────────

  /** Index the cursor should resume at, or undefined when nothing was restored. */
  get restoredCursor(): number | undefined {
    return this._restoredCursor;
  }

  /** Index the anchor should resume at, or undefined when nothing was restored. */
  get restoredAnchor(): number | undefined {
    return this._restoredAnchor;
  }

  // ── live position (written by DeckIterator) ─────────────────────────────

  get cursor(): number {
    return this._cursor;
  }

  setCursor(index: number): void {
    if (this._cursor === index) return;
    this._cursor = index;
    this.markDirty();
  }

  get anchor(): number {
    return this._anchor;
  }

  setAnchor(index: number): void {
    if (this._anchor === index) return;
    this._anchor = index;
    this.markDirty();
  }

  get hasSavePoint(): boolean {
    return this._anchor > 0;
  }

  get hintUsedHere(): boolean {
    return this._hintUsedHere;
  }

  setHintUsedHere(value: boolean): void {
    if (this._hintUsedHere === value) return;
    this._hintUsedHere = value;
    this.markDirty();
  }

  // ── rewind loop guard ───────────────────────────────────────────────────

  hasRewoundLevel(level: number): boolean {
    return this._rewoundLevels.has(level);
  }

  markLevelRewound(level: number): void {
    if (this._rewoundLevels.has(level)) return;
    this._rewoundLevels.add(level);
    this.markDirty();
  }

  clearRewoundLevels(): void {
    if (this._rewoundLevels.size === 0) return;
    this._rewoundLevels.clear();
    this.markDirty();
  }

  // ── progress ────────────────────────────────────────────────────────────

  recordHintUsed(index: number): void {
    const entry = this.entries[index];
    if (!entry) return;
    if (!entry.hintUsed) {
      entry.hintUsed = true;
      this.markDirty();
    }
  }

  recordSolved(index: number, usedHint: boolean, exact?: boolean): void {
    const entry = this.entries[index];
    if (!entry) return;
    entry.attempts++;
    entry.solvedWithoutHint = !usedHint;
    entry.solvedExactly = exact;
    entry.solvedAt = Date.now();
    entry.lastSeenAt = Date.now();
    this.markDirty();
  }

  recordSeen(index: number): void {
    const entry = this.entries[index];
    if (entry) entry.lastSeenAt = Date.now();
  }

  // ── persistence ─────────────────────────────────────────────────────────

  /**
   * @param currentIndex optional live cursor from the caller (SessionSyncService
   *        reads it straight off the iterator). When supplied it wins, so the
   *        snapshot cannot lag behind the iterator.
   */
  serialize(currentIndex?: number): PersistedSessionState {
    if (typeof currentIndex === 'number' && currentIndex >= 0) {
      this._cursor = currentIndex;
    }

    return {
      version: SESSION_STATE_VERSION,
      cursorUid: this.uidAtOrNull(this._cursor),
      anchorUid: this._anchor > 0 ? this.uidAtOrNull(this._anchor) : null,
      hintUsedHere: this._hintUsedHere,
      rewoundLevels: [...this._rewoundLevels],
      cards: this.entries
        // Only cards with something to say. Keeps payloads small on big decks.
        .filter(e => e.attempts > 0 || e.hintUsed || e.solvedAt !== undefined)
        .map(e => ({
          uid: e.uid,
          hintUsed: e.hintUsed,
          attempts: e.attempts,
          solvedWithoutHint: e.solvedWithoutHint,
          solvedExactly: e.solvedExactly,
          solvedAt: e.solvedAt,
        })),
    };
  }

  markClean(): void {
    this._dirty$.next(false);
  }

  private restore(state: PersistedSessionState): void {
    // A v1 payload is positional and cannot be mapped onto uids. Applying it
    // would hand every card a stranger's progress, so it is dropped.
    if (state.version !== SESSION_STATE_VERSION) return;

    for (const saved of state.cards ?? []) {
      const entry = this.byUid.get(saved.uid);
      if (!entry) continue; // card was removed or edited since the save
      entry.hintUsed = saved.hintUsed;
      entry.attempts = saved.attempts;
      entry.solvedWithoutHint = saved.solvedWithoutHint;
      entry.solvedExactly = saved.solvedExactly;
      entry.solvedAt = saved.solvedAt;
    }

    const cursor = state.cursorUid ? this.deck.indexOfUid(state.cursorUid) : -1;
    if (cursor >= 0) {
      this._cursor = cursor;
      this._restoredCursor = cursor;
    }

    const anchor = state.anchorUid ? this.deck.indexOfUid(state.anchorUid) : -1;
    if (anchor >= 0) {
      this._anchor = anchor;
      this._restoredAnchor = anchor;
    }

    this._hintUsedHere = state.hintUsedHere ?? false;
    this._rewoundLevels = new Set(state.rewoundLevels ?? []);
  }

  private uidAtOrNull(index: number): string | null {
    if (index < 0 || index >= this.entries.length) return null;
    return this.entries[index].uid;
  }

  private markDirty(): void {
    this._dirty$.next(true);
  }
}

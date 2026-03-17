
import {BehaviorSubject, Observable} from 'rxjs';
import {Card} from '../../answer-slots/quiz.model';

export interface CardSessionEntry {
  card: Card;
  hintUsed: boolean;
  attempts: number;
  solvedWithoutHint: boolean;
  solvedAt?: number;        // epoch ms — undefined until solved
  lastSeenAt?: number;
}

export interface PersistedCardState {
  cardIndex: number;
  hintUsed: boolean;
  attempts: number;
  solvedWithoutHint: boolean;
  solvedAt?: number;
}

export interface PersistedSessionState {
  currentIndex: number;
  cards: PersistedCardState[];
}

export class QuizSession {
  private entries: CardSessionEntry[];
  private _dirty$ = new BehaviorSubject<boolean>(false);

  /** Emits true whenever the session has unsaved changes. */
  dirty$: Observable<boolean> = this._dirty$.asObservable();

  constructor(cards: Card[], priorState?: PersistedSessionState) {
    this.entries = cards.map((card, i) => {
      const prior = priorState?.cards.find(c => c.cardIndex === i);
      return {
        card,
        hintUsed: prior?.hintUsed ?? false,
        attempts: prior?.attempts ?? 0,
        solvedWithoutHint: prior?.solvedWithoutHint ?? false,
        solvedAt: prior?.solvedAt,
      };
    });
  }

  get length(): number {
    return this.entries.length;
  }

  get restoredIndex(): number | undefined {
    // Caller passes priorState.currentIndex through the constructor chain;
    // stored externally (DeckIterator holds cursor, not the session).
    return undefined; // overridden by factory — see SessionFactory
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

  recordHintUsed(index: number): void {
    const entry = this.entries[index];
    if (!entry.hintUsed) {
      entry.hintUsed = true;
      this.markDirty();
    }
  }

  recordSolved(index: number, usedHint: boolean): void {
    const entry = this.entries[index];
    entry.attempts++;
    entry.solvedWithoutHint = !usedHint;
    entry.solvedAt = Date.now();
    entry.lastSeenAt = Date.now();
    this.markDirty();
  }

  recordSeen(index: number): void {
    this.entries[index].lastSeenAt = Date.now();
  }

  serialize(currentIndex: number): PersistedSessionState {
    return {
      currentIndex,
      cards: this.entries.map((e, i) => ({
        cardIndex: i,
        hintUsed: e.hintUsed,
        attempts: e.attempts,
        solvedWithoutHint: e.solvedWithoutHint,
        solvedAt: e.solvedAt,
      })),
    };
  }

  markClean(): void {
    this._dirty$.next(false);
  }

  private markDirty(): void {
    this._dirty$.next(true);
  }
}

import {Observable, ReplaySubject, Subject} from 'rxjs';
import {Card} from '../../model/quiz.model';
import {DeckCommand} from './deck-iterator.model';
import {QuizSession} from '../quiz-session/quiz-session';
import {DEFAULT_REWIND_RULE, resumeIndex, RewindRule} from '../quiz-session/rewind';

export interface DeckIteratorOptions {
  /** Where to resume after answering a card a hint was taken on. */
  rewind?: RewindRule;
  /** Initial anchor / save point. Defaults to 0 (deck start). */
  anchor?: number;
}

export class DeckIterator implements DeckCommand {
  private cardSubject = new ReplaySubject<Card>(1);
  private card$: Observable<Card> = this.cardSubject.asObservable();

  private completedSubject = new Subject<void>();
  deckCompleted$: Observable<void> = this.completedSubject.asObservable();

  private index = 0;
  private rewind: RewindRule;

  constructor(
    private session: QuizSession,
    options: DeckIteratorOptions = {},
  ) {
    this.rewind = options.rewind ?? DEFAULT_REWIND_RULE;

    this.index = clamp(options.anchor ?? 0, 0, Math.max(0, session.length - 1));
    this.session.setCursor(this.index);
    if (options.anchor !== undefined) {
      this.session.setAnchor(this.index);
    }
    this.emitCurrent();
  }

  /**
   * Swap in a new session (deck load, re-sort, restore).
   *
   * No hint-state reconstruction here any more: `hintUsedHere` is real
   * persisted state on the session rather than something inferred from
   * `entry.hintUsed && !entry.solvedAt`.
   */
  replaceSession(session: QuizSession, fallbackIndex?: number): void {
    this.session = session;

    const restored = session.restoredCursor ?? fallbackIndex ?? 0;
    this.index = clamp(restored, 0, Math.max(0, session.length - 1));
    this.session.setCursor(this.index);
    this.emitCurrent();
  }

  // ── reads ───────────────────────────────────────────────────────────────

  initialCard(): Card {
    return this.session.getCard(0);
  }

  getCard$(): Observable<Card> {
    return this.card$;
  }

  getCurrentIndex(): number {
    return this.index;
  }

  getSession(): QuizSession {
    return this.session;
  }

  getRewindRule(): RewindRule {
    return this.rewind;
  }

  // ── the hint mechanic ───────────────────────────────────────────────────

  useHint(): void {
    if (this.session.length === 0) return;
    this.session.recordHintUsed(this.index);
    this.session.setHintUsedHere(true);
  }

  /**
   * The user answered the current card.
   *
   * @param withoutHelp explicit `false` marks the answer as hint-assisted even
   *        when no hint modal was opened.
   * @param exact
   */
  proceed(withoutHelp?: boolean, exact?: boolean): void {
    if (this.session.length === 0) return;

    const usedHint = withoutHelp === false || this.session.hintUsedHere;
    this.session.recordSolved(this.index, usedHint, exact);

    // A resume target equal to the current index means "nothing to rewind
    // to" — advance instead. The old code jumped to it unconditionally, which
    // is why NoRewindStrategy pinned the user on the same card forever.
    const target = usedHint ? this.previewResume() : this.index;
    const next = target < this.index ? target : this.index + 1;

    this.session.setHintUsedHere(false);

    if (next >= this.session.length) {
      this.completedSubject.next();
      return;
    }

    this.setIndex(next);
  }

  // ── navigation ──────────────────────────────────────────────────────────

  nextCard(): void {
    this.session.setHintUsedHere(false);
    if (this.index < this.session.length - 1) {
      this.setIndex(this.index + 1);
    } else {
      this.completedSubject.next();
    }
  }

  previousCard(): void {
    this.session.setHintUsedHere(false);
    if (this.index > this.session.anchor) {
      this.setIndex(this.index - 1);
    }
  }

  /**
   * Where a hint-assisted answer would land *right now*, without spending the
   * once-per-level budget. Returns the current index when nothing would happen.
   */
  /** Where a hint-assisted answer would land right now. Equals the cursor when nothing happens. */
  previewResume(): number {
    return resumeIndex(
      {cursor: this.index, anchor: this.session.anchor},
      this.session.deck,
      this.rewind,
    );
  }

  private resolveResume(commit: boolean): number {
    const level = this.session.deck.levelAt(this.index);

    const target = resumeIndex(
      {cursor: this.index, anchor: this.session.anchor},
      this.session.deck,
      this.rewind,
    );

    return target;
  }

  restart(): void {
    this.session.setHintUsedHere(false);
    this.setIndex(this.session.anchor);
  }

  jumpTo(predicate: (card: Card) => boolean): void {
    for (let i = 0; i < this.session.length; i++) {
      if (predicate(this.session.getCard(i))) {
        this.session.setHintUsedHere(false);
        this.setIndex(i);
        return;
      }
    }
  }

  // ── save point ──────────────────────────────────────────────────────────

  /** Drop a save point on the current card. */
  setAsStartPoint(): void {
    this.session.setAnchor(this.index);
  }

  /** Remove the save point; the anchor falls back to deck start. */
  clearStartPoint(): void {
    this.session.setAnchor(0);
  }

  getAnchor(): number {
    return this.session.anchor;
  }

  hasSavePoint(): boolean {
    return this.session.hasSavePoint;
  }

  // ── config ──────────────────────────────────────────────────────────────

  setRewindRule(rule: RewindRule): void {
    this.rewind = rule;
  }

  /** Not implemented. Kept so existing template bindings keep compiling. */
  toggleCardType(_cardType?: string): void {
    // TODO: filter session entries by subjectType, rebuild visible indices
  }

  // ── internals ───────────────────────────────────────────────────────────

  private setIndex(index: number): void {
    this.index = index;
    this.session.setCursor(index);
    this.emitCurrent();
  }

  private emitCurrent(): void {
    if (this.index >= 0 && this.index < this.session.length) {
      const card = this.session.getCard(this.index);
      this.session.recordSeen(this.index);
      this.cardSubject.next(card);
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

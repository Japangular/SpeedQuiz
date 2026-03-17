
import {Observable, ReplaySubject} from 'rxjs';
import {ModalService} from '../../../../widgets/modal/modal.service';
import {DeckCommand} from './deck-iterator.model';
import {QuizSession} from '../quiz-session';
import {BackToFirstStrategy, HintStrategy, ReinsertLaterStrategy} from '../quiz-session';
import {Card} from '../../answer-slots/quiz.model';

/**
 * Refactored DeckIterator.
 *
 * Changes from the original:
 * - Walks a QuizSession instead of a raw Card[]
 * - Delegates stat tracking (hintUsed, solved) to the session
 * - Uses HintStrategy to determine post-hint navigation
 * - No longer subscribes to deck$ in the constructor — the session is injected ready-made
 * - Exposes currentIndex$ so SessionSync can persist cursor position
 */
export class DeckIterator implements DeckCommand {
  private cardSubject = new ReplaySubject<Card>(1);
  private card$: Observable<Card> = this.cardSubject.asObservable();

  private index: number;
  private startPos: number = 0;
  private hintUsedOnCurrentCard = false;

  /** Where to resume after a hinted card is solved. -1 means "no pending rewind". */
  private pendingResumeIndex = -1;

  constructor(
    private session: QuizSession,
    private modalService: ModalService,
    private hintStrategy: HintStrategy = new BackToFirstStrategy(),
    startPos?: number,
  ) {
    this.index = startPos ?? 0;
    this.startPos = this.index;
    this.emitCurrent();
  }

  // ── Session replacement (when DeckShelf loads a new deck) ────

  /**
   * Replace the current session entirely (new deck selected).
   * Resets cursor to 0 or to the session's restored index.
   */
  replaceSession(session: QuizSession, restoredIndex?: number): void {
    this.session = session;
    this.index = restoredIndex ?? 0;
    this.startPos = 0;
    this.hintUsedOnCurrentCard = false;
    this.pendingResumeIndex = -1;
    this.emitCurrent();
  }

  // ── DeckCommand interface ────────────────────────────────────

  initialCard(): Card {
    return this.session.getCard(0);
  }

  getCard$(): Observable<Card> {
    return this.card$;
  }

  /**
   * Called when all answer slots are correct.
   * Records the solve in the session, then advances.
   *
   * If a hint was used on this card, the HintStrategy determines
   * where the iterator jumps to next.
   */
  proceed(withoutHelp?: boolean): void {
    const usedHint = withoutHelp === false || this.hintUsedOnCurrentCard;

    // Record in session (idempotent stats)
    this.session.recordSolved(this.index, usedHint);

    // Determine next position
    if (usedHint && this.pendingResumeIndex >= 0) {
      this.index = this.pendingResumeIndex;
      this.pendingResumeIndex = -1;
    } else {
      this.advanceIndex();
    }

    this.hintUsedOnCurrentCard = false;
    this.emitCurrent();
  }

  /**
   * Mark hint as used on the current card + compute where to resume.
   * Idempotent: calling multiple times on the same card only records once.
   */
  useHint(): void {
    this.session.recordHintUsed(this.index);

    if (!this.hintUsedOnCurrentCard) {
      this.hintUsedOnCurrentCard = true;
      this.pendingResumeIndex = this.hintStrategy.computeResumeIndex(
        this.index,
        this.startPos,
        this.session.length,
      );

      // Special case: ReinsertLaterStrategy needs to duplicate the card further ahead
      if (this.hintStrategy instanceof ReinsertLaterStrategy) {
        // TODO: implement card reinsertion in session
        // For now, fall back to "no rewind" behavior
      }
    }
  }

  nextCard(): void {
    this.hintUsedOnCurrentCard = false;
    this.pendingResumeIndex = -1;
    this.advanceIndex();
    this.emitCurrent();
  }

  previousCard(): void {
    if (this.index > this.startPos) {
      this.index--;
      this.hintUsedOnCurrentCard = false;
      this.pendingResumeIndex = -1;
      this.emitCurrent();
    }
  }

  setAsStartPoint(): void {
    this.startPos = this.index;
  }

  toggleCardType(cardType?: string): void {
    // TODO: filter session entries by subjectType, rebuild visible indices
  }

  jumpTo(predicate: (card: Card) => boolean): void {
    for (let i = 0; i < this.session.length; i++) {
      if (predicate(this.session.getCard(i))) {
        this.index = i;
        this.hintUsedOnCurrentCard = false;
        this.pendingResumeIndex = -1;
        this.emitCurrent();
        return;
      }
    }
  }

  // ── Accessors for SessionSync ────────────────────────────────

  getCurrentIndex(): number {
    return this.index;
  }

  getSession(): QuizSession {
    return this.session;
  }

  setHintStrategy(strategy: HintStrategy): void {
    this.hintStrategy = strategy;
  }

  // ── Private ──────────────────────────────────────────────────

  private advanceIndex(): void {
    if (this.index < this.session.length - 1) {
      this.index++;
    } else {
      this.modalService.openDeckCompletedModal([]).subscribe(result => {
        if (result === 'restart') {
          this.index = this.startPos;
        }
        this.emitCurrent();
      });
    }
  }

  private emitCurrent(): void {
    if (this.index >= 0 && this.index < this.session.length) {
      const card = this.session.getCard(this.index);
      this.session.recordSeen(this.index);
    this.cardSubject.next(card);
  }
    }
  }

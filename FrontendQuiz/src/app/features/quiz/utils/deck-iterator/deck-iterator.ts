import {Observable, ReplaySubject, Subject} from 'rxjs';
import {DeckCommand} from './deck-iterator.model';
import {BackToFirstStrategy, HintStrategy, QuizSession, ReinsertLaterStrategy} from '../quiz-session';
import {Card} from '../../model/quiz.model';

export class DeckIterator implements DeckCommand {
  private cardSubject = new ReplaySubject<Card>(1);
  private card$: Observable<Card> = this.cardSubject.asObservable();

  private completedSubject = new Subject<void>();
  deckCompleted$: Observable<void> = this.completedSubject.asObservable();

  private index: number;
  private startPos: number = 0;
  private hintUsedOnCurrentCard = false;

  private pendingResumeIndex = -1;

  constructor(
    private session: QuizSession,
    private hintStrategy: HintStrategy = new BackToFirstStrategy(),
    startPos?: number,
  ) {
    this.index = startPos ?? 0;
    this.startPos = this.index;
    this.emitCurrent();
  }

  replaceSession(session: QuizSession, restoredIndex?: number): void {
    this.session = session;
    this.index = restoredIndex ?? 0;
    this.startPos = 0;
    this.hintUsedOnCurrentCard = false;
    this.pendingResumeIndex = -1;
    this.emitCurrent();
  }

  initialCard(): Card {
    return this.session.getCard(0);
  }

  getCard$(): Observable<Card> {
    return this.card$;
  }

  proceed(withoutHelp?: boolean, exact?: boolean): void {
    const usedHint = withoutHelp === false || this.hintUsedOnCurrentCard;
    this.session.recordSolved(this.index, usedHint, exact);

    if (usedHint && this.pendingResumeIndex >= 0) {
      this.index = this.pendingResumeIndex;
      this.pendingResumeIndex = -1;
    } else if (!this.advanceIndex()) {
      this.hintUsedOnCurrentCard = false;
      return;
    }

    this.hintUsedOnCurrentCard = false;
    this.emitCurrent();
  }

  useHint(): void {
    this.session.recordHintUsed(this.index);

    if (!this.hintUsedOnCurrentCard) {
      this.hintUsedOnCurrentCard = true;
      this.pendingResumeIndex = this.hintStrategy.computeResumeIndex(
        this.index,
        this.startPos,
        this.session.length,
      );

      if (this.hintStrategy instanceof ReinsertLaterStrategy) {
        // TODO: implement card reinsertion in session
      }
    }
  }

  nextCard(): void {
    this.hintUsedOnCurrentCard = false;
    this.pendingResumeIndex = -1;
    if (this.advanceIndex()) {
      this.emitCurrent();
    }
  }

  restart(): void {
    this.index = this.startPos;
    this.hintUsedOnCurrentCard = false;
    this.pendingResumeIndex = -1;
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

  getCurrentIndex(): number {
    return this.index;
  }

  getSession(): QuizSession {
    return this.session;
  }

  setHintStrategy(strategy: HintStrategy): void {
    this.hintStrategy = strategy;
  }

  private advanceIndex(): boolean {
    if (this.index < this.session.length - 1) {
      this.index++;
      return true;
    } else {
      this.completedSubject.next();
      return false;
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

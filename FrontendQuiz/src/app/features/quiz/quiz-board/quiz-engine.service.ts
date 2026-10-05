import {Injectable, OnDestroy, effect, inject} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {Observable, Subject, Subscription, map, share} from 'rxjs';
import {DeckCommand} from '../utils/deck-iterator/deck-iterator.model';
import {DeckContent} from '../../../models/deck.model';
import {DeckIterator} from '../utils/deck-iterator/deck-iterator';
import {
  CardOrderMode, newOrderSeed, PersistedSessionState, QuizSession, rewindLabel, RewindRule,
  SessionSyncService, strategyForOrder,
} from '../utils/quiz-session';
import {Card, mapDeck} from '../model/quiz.model';
import {DeckStore} from '../../../store/deck.store';
import {QuizSettingsService} from '../quiz-settings.service';
import {DeckLockService, DeckLockStatus} from '../utils/quiz-session/deck-lock.service';
import {DeckRunResult, DeckTimerService} from '../deck-timer.service';

import type {CardSessionEntry} from '../utils/quiz-session';

export interface ResumePoint {
  rule: RewindRule;
  /** Rule label, e.g. 'Back to start of level'. */
  label: string;
  /** Index a hint-assisted answer would land on. Equals the cursor when nothing happens. */
  index: number;
  /** The card at that index — undefined when no rewind would occur. */
  card?: Card;
  /** False for `none`, for already-at-target. */
  willRewind: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class QuizEngine implements OnDestroy {
  card$!: Observable<Card>;
  /** Fires when the last card is passed, carrying the run's time. */
  deckCompleted$!: Observable<DeckRunResult>;
  private resetSubject = new Subject<void>();
  reset$ = this.resetSubject.asObservable();

  private readonly deckIterator!: DeckIterator;
  private session!: QuizSession;
  private deckSub?: Subscription;

  /**
   * Seed of the current shuffled order. Kept even while the deck is in
   * original order, so switching back to "shuffled once" returns to the same
   * shuffle instead of inventing a new one.
   */
  private orderSeed?: number;
  /** Guards initSession against a second deck loading while the first still awaits. */
  private initGeneration = 0;

  private currentDeckId?: string;
  private deckStore = inject(DeckStore);
  private deckLock = inject(DeckLockService);
  readonly lockStatus = this.deckLock.status;
  private settings = inject(QuizSettingsService);
  private timer = inject(DeckTimerService);

  constructor(private sessionSync: SessionSyncService) {
    this.session = new QuizSession([]);
    this.deckIterator = new DeckIterator(this.session, {
      rewind: this.settings.rewindRule(),
    });
    this.card$ = this.deckIterator.getCard$();

    // share(): the run must be closed exactly once per completion, however
    // many subscribers there are.
    this.deckCompleted$ = this.deckIterator.deckCompleted$.pipe(
      map(() => this.timer.complete(this.settings.cardOrder())),
      share(),
    );

    // Settings are the single source of truth; the iterator follows them.
    // Also covers attachDeck() swapping in a deck's stored override.
    effect(() => {
      this.deckIterator.setRewindRule(this.settings.rewindRule());
    });

    this.deckSub = toObservable(this.deckStore.deck).subscribe(deck => {
      if (!deck || deck.cards.length === 0) return;
      this.initSession(deck);
    });
  }

  ngOnDestroy(): void {
    this.deckSub?.unsubscribe();
    this.saveBeforeLeave();
    this.sessionSync.stopSync();
    this.timer.detach();
  }

  getDeckCommand(): DeckCommand {
    return this.deckIterator;
  }

  nextCard(withoutHelp?: boolean, exact?: boolean): void {
    // Before proceed(): answering the last card completes the deck
    // synchronously, and the run is judged on what has been solved by then.
    const entry = this.currentEntry;
    if (entry) this.timer.recordSolved(entry.uid);

    this.deckIterator.proceed(withoutHelp, exact);
  }

  useHint(): void {
    this.deckIterator.useHint();
    this.timer.recordHint();
  }

  resetSession(): void {
    const deckId = this.currentDeckId;
    if (!deckId) return;

    // Stop auto-sync so stale data doesn't get written back
    this.sessionSync.stopSync();

    // Clear persisted state (local + backend)
    this.sessionSync.clearLocal(deckId);
    this.sessionSync.clearSession(deckId);

    // Rebuild session from the current deck without prior state
    const deck = this.deckStore.deck();
    if (!deck || deck.cards.length === 0) return;

    if (this.settings.cardOrder() === 'shuffledEachRun') this.orderSeed = newOrderSeed();
    const cards = this.layOut(deck);

    this.session = new QuizSession(cards, undefined, this.orderSeed);   // no priorState
    this.deckIterator.replaceSession(this.session, 0);

    // Restart auto-sync with the fresh session
    this.sessionSync.startSync(
      deckId, this.session, () => this.deckIterator.getCurrentIndex()
    );
    // A fresh session is not dirty, so nothing would be written until the first
    // answer — and a reload before that would lose the seed, i.e. the "fixed"
    // order. Only needed when there is a seed to lose.
    if (this.orderSeed !== undefined) {
      this.sessionSync.saveNow(deckId, this.session, 0);
    }

    this.timer.setRunCards(this.runLength);
    this.timer.beginRun();
    this.resetSubject.next();
  }

  get currentEntry(): CardSessionEntry | undefined {
    return this.session.getEntry(this.deckIterator.getCurrentIndex());
  }

  getSession(): QuizSession {
    return this.session;
  }

  get rewindRule(): RewindRule { return this.settings.rewindRule(); }
  get hasSavePoint(): boolean  { return this.deckIterator.hasSavePoint(); }
  get savePointCard(): Card | undefined {
    return this.hasSavePoint ? this.session.getCard(this.deckIterator.getAnchor()) : undefined;
  }

  private async initSession(deck: DeckContent): Promise<void> {
    const generation = ++this.initGeneration;

    this.resetSubject.next();
    const deckId = this.deckStore.deckId() ?? this.deckStore.deckName();
    this.currentDeckId = deckId;

    let priorState: PersistedSessionState | undefined;
    let lock: DeckLockStatus = 'unsupported';
    if (deckId) {
      priorState = await this.sessionSync.loadPriorState(deckId);
      lock = await this.deckLock.claim(deckId);
    }
    if (generation !== this.initGeneration) return;   // a newer deck load overtook this one

    // The deck's own settings have to be in place BEFORE the cards are laid
    // out — the card order is one of them. quiz-board attaches too, but only
    // once the first card arrives, which is too late for this. Same id as the
    // board uses, so its later call is a no-op.
    this.settings.attachDeck(this.deckStore.deckId());

    // The seed comes from the saved state, not from settings: the saved cursor
    // only makes sense in the order it was saved in.
    this.orderSeed = priorState?.orderSeed;
    const cards = this.layOut(deck);

    // Everyone gets a readable deck — a follower is read-only, not blank.
    this.session = new QuizSession(cards, priorState, this.orderSeed);
    this.deckIterator.replaceSession(this.session);

    if (!deckId) {
      this.timer.detach();
      return;
    }

    this.deckLock.onYield = () =>
      this.sessionSync.saveNow(deckId, this.session, this.deckIterator.getCurrentIndex());

    if (lock === 'follower') {   // never startSync — that's the whole point
      this.timer.detach();       // and no clock either: this tab's answers don't count
      return;
    }
    this.sessionSync.startSync(deckId, this.session, () => this.deckIterator.getCurrentIndex());
    this.timer.attach(deckId, this.runLength);
  }

  get deck() { return this.session.deck; }

  private saveBeforeLeave(): void {
    if (this.deckLock.status() === 'follower') return;
    if (this.currentDeckId && this.session) {
      this.sessionSync.saveNow(
        this.currentDeckId,
        this.session,
        this.deckIterator.getCurrentIndex(),
      );
    }
  }

  async takeOverDeck(): Promise<void> {
    const deckId = this.currentDeckId;
    if (!deckId) return;
    if (await this.deckLock.takeOver() !== 'owner') return;

    // The other tab kept playing after we loaded — pull its flushed state.
    const priorState = await this.sessionSync.loadPriorState(deckId);
    const deck = this.deckStore.deck();
    if (!deck) return;

    this.orderSeed = priorState?.orderSeed ?? this.orderSeed;
    this.session = new QuizSession(this.layOut(deck), priorState, this.orderSeed);
    this.deckIterator.replaceSession(this.session);
    this.resetSubject.next();          // sidebar rebuilds its history
    this.sessionSync.startSync(deckId, this.session, () => this.deckIterator.getCurrentIndex());
    this.timer.attach(deckId, this.runLength);
  }

  /** Fires when the anchor moves — neither card$ nor a signal covers that. */
  private savePointSubject = new Subject<void>();
  savePointChanged$ = this.savePointSubject.asObservable();

  saveHere(): void {
    this.deckIterator.setAsStartPoint();
    this.timer.setRunCards(this.runLength);
    this.savePointSubject.next();
  }

  clearSave(): void {
    this.deckIterator.clearStartPoint();
    this.timer.setRunCards(this.runLength);
    this.savePointSubject.next();
  }

  // ── card order & runs ─────────────────────────────────────────────────────

  get cardOrder(): CardOrderMode { return this.settings.cardOrder(); }

  /**
   * Switch the deck's order. Starts a new run from the first card: a position
   * in one order means nothing in another, and neither does a half-finished time.
   * Per-card progress is kept.
   */
  setCardOrder(mode: CardOrderMode): void {
    if (mode === this.settings.cardOrder()) return;
    this.settings.cardOrder.set(mode);
    // "Shuffled once" reuses the deck's existing shuffle when it has one.
    this.startNewRun(mode === 'shuffledEachRun');
  }

  /** New shuffle on demand — how a "shuffled once" order gets replaced. */
  reshuffle(): void {
    if (this.settings.cardOrder() === 'original') return;
    this.startNewRun(true);
  }

  /** "Restart" from the deck-completed dialog. */
  restartRun(): void {
    if (this.settings.cardOrder() === 'shuffledEachRun') {
      this.startNewRun(true);
      return;
    }
    this.deckIterator.restart();   // back to the save point, as before
    this.timer.beginRun();
  }

  /** Cards a run has to cover: from the save point to the end. */
  private get runLength(): number {
    return Math.max(0, this.session.length - this.session.anchor);
  }

  private layOut(deck: DeckContent): Card[] {
    const mode = this.settings.cardOrder();
    if (mode !== 'original' && this.orderSeed === undefined) {
      this.orderSeed = newOrderSeed();
    }
    return strategyForOrder(mode, this.orderSeed).sort(mapDeck(deck));
  }

  /**
   * Re-lay the deck and start over at the first card, keeping what is known
   * about each card. Cursor and save point are dropped on purpose: both are
   * positions, and the positions have just changed.
   */
  private startNewRun(reseed: boolean): void {
    const deck = this.deckStore.deck();
    if (!deck || deck.cards.length === 0) return;

    if (reseed) this.orderSeed = newOrderSeed();

    const progress: PersistedSessionState = {
      ...this.session.serialize(this.deckIterator.getCurrentIndex()),
      cursorUid: null,
      anchorUid: null,
      hintUsedHere: false,
    };
    const session = new QuizSession(this.layOut(deck), progress, this.orderSeed);

    this.sessionSync.stopSync();
    this.resetSubject.next();            // before the swap, so the sidebar rebuilds from the new session
    this.session = session;
    this.deckIterator.replaceSession(session, 0);
    this.savePointSubject.next();

    const deckId = this.currentDeckId;
    if (deckId && this.deckLock.status() !== 'follower') {
      this.sessionSync.startSync(deckId, session, () => this.deckIterator.getCurrentIndex());
      this.sessionSync.saveNow(deckId, session, 0);   // persist the new seed now, not on the first answer
    }

    this.timer.setRunCards(this.runLength);
    this.timer.beginRun();
  }

  get resumePoint(): ResumePoint {
    const rule = this.settings.rewindRule();
    const deck = this.session.deck;
    const label = rewindLabel(rule, this.hasSavePoint);

    if (deck.length === 0) {
      return {rule, label, index: 0, willRewind: false};
    }

    const cursor = this.deckIterator.getCurrentIndex();

    const index = this.deckIterator.previewResume();
    const willRewind = index < cursor;

    return {
      rule,
      label,
      index,
      card: willRewind ? this.session.getCard(index) : undefined,
      willRewind,
    };
  }
}

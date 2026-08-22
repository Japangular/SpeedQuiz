import {effect, inject, Injectable, OnDestroy} from '@angular/core';
import {Observable, Subject, Subscription} from 'rxjs';
import {DeckCommand} from '../utils/deck-iterator/deck-iterator.model';
import {DeckContent} from '../../../models/deck.model';
import {DeckIterator} from '../utils/deck-iterator/deck-iterator';
import {
  ByIndexStrategy, PersistedSessionState,QuizSession, rewindLabel, RewindRule,
  SessionSyncService, SortStrategy,
} from '../utils/quiz-session';
import {Card, mapDeck} from '../model/quiz.model';
import {DeckStore} from '../../../store/deck.store';
import {toObservable} from '@angular/core/rxjs-interop';
import {QuizSettingsService} from '../quiz-settings.service';
import {DeckLockService, DeckLockStatus} from '../utils/quiz-session/deck-lock.service';

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
  deckCompleted$!: Observable<void>;
  private resetSubject = new Subject<void>();
  reset$ = this.resetSubject.asObservable();


  private readonly deckIterator!: DeckIterator;
  private session!: QuizSession;
  private deckSub?: Subscription;

  private sortStrategy: SortStrategy = new ByIndexStrategy();
  private currentDeckId?: string;
  private deckStore = inject(DeckStore);
  private deckLock = inject(DeckLockService);
  readonly lockStatus = this.deckLock.status;
  private settings = inject(QuizSettingsService);

  constructor(private sessionSync: SessionSyncService) {
    this.session = new QuizSession([]);
    this.deckIterator = new DeckIterator(this.session, {
      rewind: this.settings.rewindRule(),
    });
    this.card$ = this.deckIterator.getCard$();
    this.deckCompleted$ = this.deckIterator.deckCompleted$;

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
  }

  getDeckCommand(): DeckCommand {
    return this.deckIterator;
  }

  nextCard(withoutHelp?: boolean, exact?: boolean): void {
    this.deckIterator.proceed(withoutHelp, exact);
  }

  useHint(): void {
    this.deckIterator.useHint();
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

    let cards = mapDeck(deck);
    cards = this.sortStrategy.sort(cards);

    this.session = new QuizSession(cards);          // no priorState
    this.deckIterator.replaceSession(this.session, 0);

    // Restart auto-sync with the fresh session
    this.sessionSync.startSync(
      deckId, this.session, () => this.deckIterator.getCurrentIndex()
    );
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
    this.resetSubject.next();
    const deckId = this.deckStore.deckId() ?? this.deckStore.deckName();
    this.currentDeckId = deckId;
    const cards = this.sortStrategy.sort(mapDeck(deck));

    let priorState: PersistedSessionState | undefined;
    let lock: DeckLockStatus = 'unsupported';
    if (deckId) {
      priorState = await this.sessionSync.loadPriorState(deckId);
      lock = await this.deckLock.claim(deckId);
    }

    // Everyone gets a readable deck — a follower is read-only, not blank.
    this.session = new QuizSession(cards, priorState);
    this.deckIterator.replaceSession(this.session);

    if (!deckId) return;

    this.deckLock.onYield = () =>
      this.sessionSync.saveNow(deckId, this.session, this.deckIterator.getCurrentIndex());

    if (lock === 'follower') return;   // never startSync — that's the whole point
    this.sessionSync.startSync(deckId, this.session, () => this.deckIterator.getCurrentIndex());
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

    this.session = new QuizSession(this.sortStrategy.sort(mapDeck(deck)), priorState);
    this.deckIterator.replaceSession(this.session);
    this.resetSubject.next();          // sidebar rebuilds its history
    this.sessionSync.startSync(deckId, this.session, () => this.deckIterator.getCurrentIndex());
  }

  /** Fires when the anchor moves — neither card$ nor a signal covers that. */
  private savePointSubject = new Subject<void>();
  savePointChanged$ = this.savePointSubject.asObservable();

  saveHere(): void  { this.deckIterator.setAsStartPoint(); this.savePointSubject.next(); }
  clearSave(): void { this.deckIterator.clearStartPoint(); this.savePointSubject.next(); }

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

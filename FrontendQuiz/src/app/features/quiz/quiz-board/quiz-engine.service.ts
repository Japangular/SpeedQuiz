import {effect, inject, Injectable, OnDestroy} from '@angular/core';
import {Observable, Subject, Subscription} from 'rxjs';
import {DeckCommand} from '../utils/deck-iterator/deck-iterator.model';
import {DeckContent} from '../../../models/deck.model';
import {DeckIterator} from '../utils/deck-iterator/deck-iterator';
import {
  ByIndexStrategy, createSortStrategy, DEFAULT_REWIND_RULE, PersistedSessionState,
  QuizSession, RewindRule, SessionSyncService, SortStrategy, SortStrategyName
} from '../utils/quiz-session';
import {Card, mapDeck} from '../model/quiz.model';
import {DeckStore} from '../../../store/deck.store';
import {toObservable} from '@angular/core/rxjs-interop';
import {QuizSettingsService} from '../quiz-settings.service';

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
  private settings = inject(QuizSettingsService);

  constructor(private sessionSync: SessionSyncService) {
    this.session = new QuizSession([]);
    this.deckIterator = new DeckIterator(this.session, {
      rewind: this.settings.rewindRule(),
      rewindOncePerLevel: this.settings.rewindOncePerLevel(),
    });
    this.card$ = this.deckIterator.getCard$();
    this.deckCompleted$ = this.deckIterator.deckCompleted$;

    // Settings are the single source of truth; the iterator follows them.
    // Also covers attachDeck() swapping in a deck's stored override.
    effect(() => {
      this.deckIterator.setRewindRule(this.settings.rewindRule());
      this.deckIterator.setRewindOncePerLevel(this.settings.rewindOncePerLevel());
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
    let cards = mapDeck(deck);
    cards = this.sortStrategy.sort(cards);

    let priorState: PersistedSessionState | undefined;
    if (deckId) {
      priorState = await this.sessionSync.loadPriorState(deckId);
    }

    this.session = new QuizSession(cards, priorState);
    this.deckIterator.replaceSession(this.session);

    if (deckId) {
      this.sessionSync.startSync(
        deckId, this.session, () => this.deckIterator.getCurrentIndex()
      );
    }
  }

  saveHere(): void  { this.deckIterator.setAsStartPoint(); }
  clearSave(): void { this.deckIterator.clearStartPoint(); }
  get deck() { return this.session.deck; }

  private saveBeforeLeave(): void {
    if (this.currentDeckId && this.session) {
      this.sessionSync.saveNow(
        this.currentDeckId,
        this.session,
        this.deckIterator.getCurrentIndex(),
      );
    }
  }
}

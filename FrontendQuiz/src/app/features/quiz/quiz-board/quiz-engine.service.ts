import {effect, inject, Injectable, OnDestroy} from '@angular/core';
import {Observable, Subject, Subscription} from 'rxjs';
import {DeckCommand} from '../utils/deck-iterator/deck-iterator.model';
import {DeckContent} from '../../../models/deck.model';
import {DeckIterator} from '../utils/deck-iterator/deck-iterator';
import {
  ByIndexStrategy, createSortStrategy, DEFAULT_REWIND_RULE, PersistedSessionState,
  QuizSession, rewindLabel, RewindRule, SessionSyncService, SortStrategy, SortStrategyName
} from '../utils/quiz-session';
import {Card, mapDeck} from '../model/quiz.model';
import {DeckStore} from '../../../store/deck.store';
import {toObservable} from '@angular/core/rxjs-interop';
import {QuizSettingsService} from '../quiz-settings.service';

export interface ResumePoint {
  rule: RewindRule;
  /** Rule label, e.g. 'Back to start of level'. */
  label: string;
  /** Index a hint-assisted answer would land on. Equals the cursor when nothing happens. */
  index: number;
  /** The card at that index — undefined when no rewind would occur. */
  card?: Card;
  /** False for `none`, for already-at-target, and for a spent level budget. */
  willRewind: boolean;
  /** True when rewindOncePerLevel is on and this level's rewind is already used. */
  spentForLevel: boolean;
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
      return {rule, label, index: 0, willRewind: false, spentForLevel: false};
    }

    const cursor = this.deckIterator.getCurrentIndex();
    const spentForLevel =
      this.settings.rewindOncePerLevel() && this.session.hasRewoundLevel(deck.levelAt(cursor));

    const index = this.deckIterator.previewResume();
    const willRewind = index < cursor;

    return {
      rule,
      label,
      index,
      card: willRewind ? this.session.getCard(index) : undefined,
      willRewind,
      spentForLevel,
    };
  }
}

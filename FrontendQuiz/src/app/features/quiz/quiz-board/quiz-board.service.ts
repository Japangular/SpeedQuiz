import {inject, Injectable, OnDestroy} from '@angular/core';
import {Observable, Subject, Subscription} from 'rxjs';
import {ModalService} from '../../../widgets/modal/modal.service';
import {DeckCommand} from '../utils/deck-iterator/deck-iterator.model';
import {SubmissionDeck} from '../../../models/deck.model';
import {DeckIterator} from '../utils/deck-iterator/deck-iterator';
import {
  BackToFirstStrategy,
  ByIndexStrategy,
  createHintStrategy,
  createSortStrategy,
  HintStrategy,
  HintStrategyName,
  PersistedSessionState,
  QuizSession,
  SessionSyncService,
  SortStrategy,
  SortStrategyName
} from '../utils/quiz-session';
import {DeckShelfService} from '../../deck-shelf/deck-shelf.service';
import {LocalProfileService} from '../../../user-store-management/local-profile.service';
import {Card, mapDeck} from '../model/quiz.model';
import {DeckStore} from '../../../store/deck.store';
import {toObservable} from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class QuizBoardService implements OnDestroy {
  card$!: Observable<Card>;
  private resetSubject = new Subject<void>();
  reset$ = this.resetSubject.asObservable();

  private readonly deckIterator!: DeckIterator;
  private session!: QuizSession;
  private deckSub?: Subscription;

  private hintStrategy: HintStrategy = new BackToFirstStrategy();
  private sortStrategy: SortStrategy = new ByIndexStrategy();
  private currentDeckId?: string;
  private deckStore = inject(DeckStore);

  constructor(
    private modal: ModalService,
    private sessionSync: SessionSyncService,
    private deckShelfService: DeckShelfService,
    private localService: LocalProfileService,
  ) {

    this.session = new QuizSession([]);
    this.deckIterator = new DeckIterator(this.session, this.hintStrategy);
    this.card$ = this.deckIterator.getCard$();

    this.deckIterator.deckCompleted$.subscribe(() => {
      this.modal.openDeckCompletedModal([]).subscribe(result => {
        if (result === 'restart') {
          this.deckIterator.restart();
        }
      });
    });

    this.deckSub = toObservable(this.deckStore.deck).subscribe(deck => {
      if (!deck || deck.cards.length === 0) return;
      this.initSession(deck);
    });

    const last = localStorage.getItem('japangular_last_deck');
    if (last && this.deckStore.cards().length === 0) {
      const {deckId, deckName} = JSON.parse(last);
      const ownerId = localService.getToken();
      if (ownerId)
        this.deckShelfService.loadDeck(deckId, ownerId).subscribe(content => {
          this.deckStore.loadDeck(content, deckName, deckId);
        });
    }
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

  setAsStartPoint(): void {
    this.deckIterator.setAsStartPoint();
    this.deckIterator.nextCard();
  }

  jumpTo(jumpKey: string): void {
    const type = detectJumpKeyType(jumpKey);

    this.deckIterator.jumpTo(card => {
      switch (type) {
        case 'index':
          return card.index === parseInt(jumpKey);
        case 'reading':
          return card.answers['reading'] === jumpKey;
        case 'meaning':
          return card.answers['meaning'].toLowerCase() === jumpKey.toLowerCase();
        default:
          return false;
      }
    });
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


  setHintStrategy(name: HintStrategyName, params?: { n?: number }): void {
    this.hintStrategy = createHintStrategy(name, params);
    this.deckIterator.setHintStrategy(this.hintStrategy);
  }

  setSortStrategy(name: SortStrategyName): void {
    this.sortStrategy = createSortStrategy(name);
    // Re-sorting mid-session: resort and rebuild session, preserving stats
    // For now, this only takes effect on next deck load.
    // TODO: implement mid-session re-sort if needed
  }

  getSession(): QuizSession {
    return this.session;
  }

  getCurrentIndex(): number {
    return this.deckIterator.getCurrentIndex();
  }

  private async initSession(deck: SubmissionDeck): Promise<void> {
    const deckId = this.deckStore.deckId() ?? this.deckStore.deckName();
    this.currentDeckId = deckId;
    let cards = mapDeck(deck);
    cards = this.sortStrategy.sort(cards);

    let priorState: PersistedSessionState | undefined;
    if (deckId) {
      priorState = await this.sessionSync.loadPriorState(deckId);
    }

    this.session = new QuizSession(cards, priorState);
    const resumeIndex = priorState?.currentIndex ?? 0;
    this.deckIterator.replaceSession(this.session, resumeIndex);

    if (deckId) {
      this.sessionSync.startSync(
        deckId, this.session, () => this.deckIterator.getCurrentIndex()
      );
    }
  }

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

type JumpKeyType = 'index' | 'meaning' | 'reading' | 'unknown';

function detectJumpKeyType(input: string): JumpKeyType {
  if (/^\d+$/.test(input)) return 'index';
  if (/^[\u3040-\u309F]+$/.test(input)) return 'reading';
  if (/^[A-Za-z]+$/.test(input)) return 'meaning';
  return 'unknown';
}

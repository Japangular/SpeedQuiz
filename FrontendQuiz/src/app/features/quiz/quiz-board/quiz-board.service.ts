import {Injectable, OnDestroy} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {Card, mapDeck} from '../answer-slots/quiz.model';
import {CardStoreService} from '../../../services/card-store.service';
import {ModalService} from '../../../widgets/modal/modal.service';
import {DeckCommand} from '../utils/deck-iterator/deck-iterator.model';
import {SubmissionDeck} from '../../../models/deck.model';
import {PropertyType} from '../../../../generated/api';
import {AnkiCard} from '../../anki-table/anki-table.model';
import {DeckIterator} from '../utils/deck-iterator/deck-iterator';
import {
  BackToFirstStrategy,
  ByIndexStrategy, createHintStrategy, createSortStrategy,
  HintStrategy,
  HintStrategyName, PersistedSessionState,
  QuizSession,
  SessionSyncService,
  SortStrategy, SortStrategyName
} from '../utils/quiz-session';
import {DeckShelfService} from '../../deck-shelf/deck-shelf.service';
import {LocalProfileService} from '../../../user-store-management/local-profile.service';

@Injectable({
  providedIn: 'root'
})
@Injectable()
export class QuizBoardService implements OnDestroy {
  card$!: Observable<Card>;

  private deckIterator!: DeckIterator;
  private session!: QuizSession;
  private deckSub?: Subscription;

  private hintStrategy: HintStrategy = new BackToFirstStrategy();
  private sortStrategy: SortStrategy = new ByIndexStrategy();
  private currentDeckId?: string;

  constructor(
    private store: CardStoreService,
    private modal: ModalService,
    private sessionSync: SessionSyncService,
    private deckShelfService: DeckShelfService,
    private localService: LocalProfileService,
  ) {

    this.session = new QuizSession([]);
    this.deckIterator = new DeckIterator(this.session, this.modal, this.hintStrategy);
    this.card$ = this.deckIterator.getCard$();

    this.deckSub = this.store._currentDeck$.subscribe(deck => {
      if (!deck || deck.cards.length === 0) return;
      this.initSession(deck);
    });

    const last = localStorage.getItem('japangular_last_deck');
    if (last && this.store.currentDeck.cards.length === 0) {
      const {deckId, deckName} = JSON.parse(last);
      const ownerId = localService.getToken();
      if (ownerId)
        this.deckShelfService.loadDeck(deckId, ownerId).subscribe(content => {
          this.store.setCurrentDeck(content, deckName, deckId);
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

  openHintModal(card: Card): void {
    this.modal.openHintModal(card).subscribe(result => {

      if (result === 'reset') {
        this.deckIterator.useHint();
      }
    });
  }

  nextCard(withoutHelp?: boolean): void {
    this.deckIterator.proceed(withoutHelp);
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

  learnSelected(ankiCards: AnkiCard[]): void {
    if (!ankiCards || ankiCards.length === 0) return;

    const cards = ankiCards.map(card => ({
      index: card.index,
      question: card.question,
      reading: card.reading,
      meaning: card.meaning,
      hint: [card.index, card.question, card.reading, card.meaning].join(' : '),
    }));

    const deck = {
      deckName: 'SelectedAnkiDeck',
      username: 'ankiUser',
      properties: {
        index: PropertyType.Info,
        question: PropertyType.Question,
        reading: PropertyType.Answer,
        meaning: PropertyType.Answer,
        hint: PropertyType.Hint,
      },
      cards: cards,
    } as SubmissionDeck;

    this.store.setCurrentDeck(deck);
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
    const deckId = this.store.currentDeckId ?? this.store.currentDeckName;
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
      this.sessionSync.startSync(deckId, this.session, () => this.deckIterator.getCurrentIndex(),);
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

import {Component, computed, inject, signal, viewChildren} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatButton} from '@angular/material/button';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatIcon} from '@angular/material/icon';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatTooltip} from '@angular/material/tooltip';
import {NgTemplateOutlet} from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {Observable, catchError, filter, map, of, switchMap, tap} from 'rxjs';

import {DeckContent} from '../../../models/deck.model';
import {DeckStore} from '../../../store/deck.store';
import {DeckShelfService} from '../../deck-shelf/deck-shelf.service';
import {cardToSlots} from '../../quiz/model/card-to-slot.adapter';
import {FieldOrderService} from '../../quiz/model/field-order.service';
import {Card, mapDeck} from '../../quiz/model/quiz.model';
import {QuizMode, Slot} from '../../quiz/model/slot.model';
import {DisplaySlotComponent} from '../../quiz/slots/display-slot/display-slot.component';
import {buildDeck, Deck, EMPTY_DECK} from '../../quiz/utils/quiz-session';
import {DEFAULT_LEARN_FLOW, isLearnFlow, LEARN_FLOWS, LearnFlow, learnFlowLabel, nextLearnIndex} from '../learn-flow';
import {LearnArrival, quizDeckKey} from '../learn-navigation';
import {LearnSlotComponent} from '../learn-slot/learn-slot.component';

const FLOW_KEY = 'learn_level_flow';

/** Same key and shape DeckShelfComponent.loadDeck writes; DeckStore restores the quiz's deck from it on reload. */
const LAST_DECK_KEY = 'japangular_last_deck';

interface AnswerSlotView {
  slot: Slot;
  field: string;
  /** Card shown + field: the same card coming round again gets fresh, empty inputs. */
  key: string;
}

/**
 * Learn mode: the deck in order, every answer shown in grey to type over.
 * After the last card of a level it either carries on or repeats the level,
 * as the user chooses (see LearnFlow).
 *
 * Switching with the quiz: the quiz sends the card it is on (LearnArrival),
 * and Learn starts there. The quiz is never touched while learning, because
 * QuizEngine and DeckStore are app-wide, so "Back to quiz" is a plain
 * navigation and lands on the card the switch was pressed on.
 *
 * Shares the deck model, level blocks, slot adapter, field order and display
 * slot with the quiz; has its own state.
 */
@Component({
  selector: 'app-learn-board',
  standalone: true,
  imports: [
    DisplaySlotComponent, LearnSlotComponent,
    MatButton, MatButtonToggleGroup, MatButtonToggle, MatIcon, MatProgressBar, MatTooltip, NgTemplateOutlet, RouterLink,
  ],
  templateUrl: './learn-board.component.html',
  styleUrl: './learn-board.component.css',
})
export class LearnBoardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly shelf = inject(DeckShelfService);
  private readonly deckStore = inject(DeckStore);
  private readonly fieldOrderService = inject(FieldOrderService);

  readonly flows = LEARN_FLOWS;
  readonly flowLabel = learnFlowLabel;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly deckId = signal('');
  readonly deckName = signal('');
  readonly deck = signal<Deck>(EMPTY_DECK);
  readonly index = signal(0);
  readonly flow = signal<LearnFlow>(loadFlow());
  /** Said out loud when the board jumps back, so the jump is not a surprise. */
  readonly announcement = signal('');

  /** The quiz holds this deck, so switching back returns to where it was left. */
  readonly quizHoldsDeck = computed(() => !!this.deckId() && this.quizDeck() === this.deckId());
  /** Switching would put this deck into the quiz in place of another one. */
  readonly replacesQuizDeck = computed(() => !this.quizHoldsDeck() && this.deckStore.hasCards());

  /** Increments with every card shown. */
  private readonly shown = signal(0);
  private content: DeckContent | null = null;
  private properties: Record<string, string> = {};
  private mode: QuizMode = {name: 'learn', questionFields: ['question'], answerFields: []};

  readonly card = computed<Card | null>(() => this.deck().cards[this.index()] ?? null);
  readonly finished = computed(() => this.deck().length > 0 && this.index() >= this.deck().length);

  private readonly slots = computed(() => {
    const card = this.card();
    return card ? cardToSlots(card, this.mode, this.properties) : [];
  });

  readonly questionSlots = computed(() => this.slots().filter(s => s.role === 'display'));

  readonly answerSlots = computed<AnswerSlotView[]>(() => {
    const shown = this.shown();
    return this.slots()
      .filter(s => s.role === 'answer')
      .map(slot => {
        const field = slot.fieldName ?? 'answer';
        return {slot, field, key: `${shown}:${field}`};
      });
  });

  readonly progress = computed(() => {
    const length = this.deck().length;
    return length === 0 ? 0 : (this.index() / length) * 100;
  });

  private readonly slotRefs = viewChildren(LearnSlotComponent);
  private solvedFields = new Set<string>();

  constructor() {
    this.route.paramMap.pipe(
      map(params => params.get('deckId')),
      filter((id): id is string => !!id),
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap(id => this.loadContent(id).pipe(
        map(deck => ({id, deck})),
        catchError(() => of(null)),
      )),
      takeUntilDestroyed(),
    ).subscribe(result => {
      this.loading.set(false);
      if (!result) {
        this.error.set('This deck could not be loaded. Check your connection, or pick it again from the deck shelf.');
        return;
      }

      const arrival = (history.state ?? {}) as LearnArrival;
      const fromQuiz = this.quizDeck() === result.id;

      this.deckId.set(result.id);
      this.deckName.set(arrival.deckName ?? (fromQuiz ? this.deckStore.deckName() : result.id));
      this.content = result.deck;
      this.properties = result.deck.properties;
      this.mode = {
        ...this.mode,
        answerFields: this.fieldOrderService.orderedAnswerFields(result.id, result.deck.properties),
      };

      const deck = buildDeck(mapDeck(result.deck));
      this.deck.set(deck);
      const start = arrival.startUid ? deck.indexOfUid(arrival.startUid) : -1;
      this.goTo(Math.max(start, 0));
    });
  }

  setFlow(value: unknown): void {
    if (!isLearnFlow(value)) return;
    this.flow.set(value);
    try {
      localStorage.setItem(FLOW_KEY, value);
    } catch { /* storage disabled: the choice just won't persist */ }
  }

  startOver(): void {
    this.goTo(0);
  }

  /**
   * Back to the quiz. When the quiz holds this deck, nothing is loaded: it is
   * exactly as it was left. Otherwise the deck goes into the quiz the same
   * way the shelf's play button puts it there, and the quiz resumes the
   * deck's saved position.
   */
  toQuiz(): void {
    if (!this.quizHoldsDeck() && this.content) {
      try {
        localStorage.setItem(LAST_DECK_KEY, JSON.stringify({deckId: this.deckId(), deckName: this.deckName()}));
      } catch { /* storage disabled: a reload just won't restore it */ }
      this.deckStore.loadDeck(this.content, this.deckName(), this.deckId());
    }
    void this.router.navigate(['/quiz']);
  }

  onSolved(field: string): void {
    this.solvedFields.add(field);
    if (this.solvedFields.size < this.answerSlots().length) {
      this.slotRefs().find(slot => !slot.done())?.focus();
      return;
    }

    const deck = this.deck();
    const from = this.index();
    const next = nextLearnIndex(deck, from, this.flow());
    this.goTo(next);
    if (next <= from && next < deck.length) {
      this.announcement.set(`Level ${deck.levelAt(next)} again, from its first card.`);
    }
  }

  /**
   * The quiz's own deck when the quiz holds this one, so Learn has exactly
   * the cards the quiz has (and a mixed deck, which exists nowhere else);
   * otherwise the deck from the server.
   */
  private loadContent(id: string): Observable<DeckContent> {
    const held = this.quizDeck() === id ? this.deckStore.deck() : null;
    return held ? of(held) : this.shelf.loadDeck(id);
  }

  private quizDeck(): string | undefined {
    return quizDeckKey(this.deckStore.deckId(), this.deckStore.deckName());
  }

  private goTo(index: number): void {
    this.solvedFields.clear();
    this.announcement.set('');
    this.index.set(this.firstAnswerableFrom(index));
    this.shown.update(n => n + 1);
  }

  /**
   * cardToSlots drops answers equal to the question; a card left with none
   * could never be finished, so it is passed over. Bounded, because under
   * repeatLevel a level of such cards would otherwise loop forever.
   */
  private firstAnswerableFrom(index: number): number {
    const deck = this.deck();
    let i = index;
    for (let steps = 0; i < deck.length && steps < deck.length; steps++) {
      if (cardToSlots(deck.cards[i], this.mode, this.properties).some(s => s.role === 'answer')) return i;
      i = nextLearnIndex(deck, i, this.flow());
    }
    return deck.length;
  }
}

function loadFlow(): LearnFlow {
  try {
    const stored = localStorage.getItem(FLOW_KEY);
    return isLearnFlow(stored) ? stored : DEFAULT_LEARN_FLOW;
  } catch {
    return DEFAULT_LEARN_FLOW;
  }
}

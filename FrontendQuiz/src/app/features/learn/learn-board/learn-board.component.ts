import {Component, computed, inject, signal, viewChildren} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatButton} from '@angular/material/button';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatIcon} from '@angular/material/icon';
import {MatProgressBar} from '@angular/material/progress-bar';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {catchError, filter, map, of, switchMap, tap} from 'rxjs';

import {DeckShelfService} from '../../deck-shelf/deck-shelf.service';
import {cardToSlots} from '../../quiz/model/card-to-slot.adapter';
import {FieldOrderService} from '../../quiz/model/field-order.service';
import {Card, mapDeck} from '../../quiz/model/quiz.model';
import {QuizMode, Slot} from '../../quiz/model/slot.model';
import {DisplaySlotComponent} from '../../quiz/slots/display-slot/display-slot.component';
import {buildDeck, Deck, EMPTY_DECK} from '../../quiz/utils/quiz-session/deck';
import {DEFAULT_LEARN_FLOW, isLearnFlow, LEARN_FLOWS, LearnFlow, learnFlowLabel, nextLearnIndex} from '../learn-flow';
import {LearnSlotComponent} from '../learn-slot/learn-slot.component';

const FLOW_KEY = 'learn_level_flow';

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
 * Shares the deck model, level blocks, slot adapter, field order and display
 * slot with the quiz; has its own state. It loads the deck itself rather than
 * reading DeckStore, so opening a deck here leaves the quiz untouched and gets
 * the whole deck, not the shelf's first-30 slice.
 */
@Component({
  selector: 'app-learn-board',
  standalone: true,
  imports: [
    DisplaySlotComponent, LearnSlotComponent,
    MatButton, MatButtonToggleGroup, MatButtonToggle, MatIcon, MatProgressBar, RouterLink,
  ],
  templateUrl: './learn-board.component.html',
  styleUrl: './learn-board.component.css',
})
export class LearnBoardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly shelf = inject(DeckShelfService);
  private readonly fieldOrderService = inject(FieldOrderService);

  readonly flows = LEARN_FLOWS;
  readonly flowLabel = learnFlowLabel;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly deckName = signal('');
  readonly deck = signal<Deck>(EMPTY_DECK);
  readonly index = signal(0);
  readonly flow = signal<LearnFlow>(loadFlow());
  /** Said out loud when the board jumps back, so the jump is not a surprise. */
  readonly announcement = signal('');

  /** Increments with every card shown. */
  private readonly shown = signal(0);
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
      switchMap(id => this.shelf.loadDeck(id).pipe(
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
      this.deckName.set(history.state?.deckName ?? result.id);
      this.properties = result.deck.properties;
      this.mode = {
        ...this.mode,
        answerFields: this.fieldOrderService.orderedAnswerFields(result.id, result.deck.properties),
      };
      this.deck.set(buildDeck(mapDeck(result.deck)));
      this.goTo(0);
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

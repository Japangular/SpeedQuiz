import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import {AfterViewInit, Component, ElementRef, HostListener, NgZone, OnDestroy, TemplateRef, ViewChild, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatAnchor, MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {Router, RouterLink} from '@angular/router';
import {Subscription} from 'rxjs';
import {DeckBarComponent} from '../../deck-bar/deck-bar.component';
import {QuizHistorySidebarComponent} from '../../quiz-history-sidebar/quiz-history-sidebar.component';
import {ContextPanelService} from '../../../layout/side-nav/panel.service';
import {ModalService} from '../../../widgets/modal/modal.service';
import {QuizEngine} from './quiz-engine.service';
import {Slot} from '../model/slot.model';
import {cardToSlots} from '../model/card-to-slot.adapter';
import {Card} from '../model/quiz.model';
import {DeckStore} from '../../../store/deck.store';
import {QuizMode} from '../model/slot.model';
import {FieldOrderService} from '../model/field-order.service';
import {SlotGroupComponent} from '../slots/slot-group/slot-group.component';
import {QuizPopoutService} from '../popout/quiz-popout.service';
import {QuizSettingsService} from '../quiz-settings.service';
import {EmoteService} from '../../../widgets/emote-overlay/emote.service';
import {EmoteOverlayComponent} from '../../../widgets/emote-overlay/emote-overlay.component';
import {DeckTimerService} from '../deck-timer.service';

import {levelHue as hueForLevel} from '../utils/level-theme';
import {LearnArrival, quizDeckKey} from '../../learn/learn-navigation';

interface HintFlash { items: { label: string; value: string }[]; key: number; }

const SHOW_STROKE_ORDER_KEY = 'quiz_show_stroke_order';

@Component({
  selector: 'app-quiz-board',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatIcon,
    MatAnchor,
    DeckBarComponent,
    QuizHistorySidebarComponent,
    SlotGroupComponent,
    DragDropModule,
    MatTooltip,
    MatIconButton,
    EmoteOverlayComponent,
    MatButton,
  ],
  templateUrl: './quiz-board.component.html',
  styleUrl: './quiz-board.component.css'
})
export class QuizBoardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('historyPanel') historyPanel!: TemplateRef<any>;
  @ViewChild('popoutHost') popoutHost!: ElementRef<HTMLElement>;

  // 'input' as well: some mobile keyboards deliver text without a usable keydown.
  @HostListener('document:keydown')
  @HostListener('document:pointerdown')
  @HostListener('document:input')

  private router = inject(Router);

  onUserActivity(): void {
    this.emotes.notifyActivity();
    this.timer.notifyActivity();
  }

  private zone = inject(NgZone);

  popout = inject(QuizPopoutService);

  currentSlots: Slot[] = [];
  fieldOrder: string[] = [];
  showReorder = false;
  currentLevel = 1;

  /** Default off; remembered across sessions. */
  showStrokeOrder = localStorage.getItem(SHOW_STROKE_ORDER_KEY) !== 'false';
  private firstCard = true;

  private lastDeckId?: string;
  private fieldOrderService = inject(FieldOrderService);

  private currentCard?: Card;
  private cardSub?: Subscription;
  private completedSub?: Subscription;
  private hotkeySub?: Subscription;
  private resetSub?: Subscription;

  private deckStore = inject(DeckStore);
  private emotes = inject(EmoteService);
  private timer = inject(DeckTimerService);

  readonly hintFlash = signal<HintFlash | null>(null);
  /** @for + track key restarts the CSS animation on repeat hints — same trick as EmoteOverlay. */
  readonly hintFlashList = computed(() => { const f = this.hintFlash(); return f ? [f] : []; });

  private flashKey = 0;
  private flashTimer?: ReturnType<typeof setTimeout>;

  constructor(
    readonly quizEngine: QuizEngine,
    private modal: ModalService,
    private contextPanel: ContextPanelService,
    readonly settings: QuizSettingsService,
  ) {
    // The deck clock only runs while the board is on screen.
    this.timer.setBoardActive(true);

    this.hotkeySub = this.popout.keydown.subscribe(e => {
      this.handleHotkeys(e);
      this.emotes.notifyActivity();
      this.timer.notifyActivity();   // typing in the floating window counts too
    });
    this.resetSub = this.quizEngine.reset$.subscribe(() => this.emotes.trigger('reset'));
    this.cardSub = this.quizEngine.card$.subscribe(card => {
      this.modal.closeHint();
      this.currentCard = card;
      this.currentLevel = card.level;
      this.emotes.trigger(this.firstCard ? 'greeting' : 'cardSwitch');
      this.firstCard = false;

      const deckId = this.deckStore.deckId();
      if (deckId !== this.lastDeckId) {
        this.lastDeckId = deckId;
        this.settings.attachDeck(deckId);
        this.fieldOrder = this.fieldOrderService.orderedAnswerFields(deckId, this.deckStore.properties());
      }

      this.currentSlots = cardToSlots(card, this.buildMode(), this.deckStore.properties());
    });

    this.completedSub = this.quizEngine.deckCompleted$.subscribe(run => {
      this.modal.openDeckCompletedModal([], run).subscribe(result => {
        if (result === 'restart') {
          // Through the engine rather than the iterator: a restart is also a
          // new timed run, and in "reshuffled every run" mode a new shuffle.
          this.quizEngine.restartRun();
        }
      });
    });
  }

  ngAfterViewInit(): void {
    Promise.resolve().then(() => {
      this.contextPanel.set(this.historyPanel, 'history', 'Recent cards');
    });
  }

  ngOnDestroy(): void {
    this.cardSub?.unsubscribe();
    this.completedSub?.unsubscribe();
    this.hotkeySub?.unsubscribe();
    this.resetSub?.unsubscribe();
    this.timer.setBoardActive(false);
    this.contextPanel.clear();
  }

  get flashMs(): number { return Math.max(1200, this.settings.hintAutoCloseSeconds() * 1000); }

  private flashAnswers(): void {
    const items = this.currentSlots
      .filter(s => s.role === 'answer')
      .map(s => ({ label: s.fieldName ?? 'answer', value: s.value }));
    if (!items.length) return;

    clearTimeout(this.flashTimer);
    this.hintFlash.set({ items, key: ++this.flashKey });
    this.flashTimer = setTimeout(
      () => this.zone.run(() => this.hintFlash.set(null)),
      this.flashMs,
    );
  }

  private clearFlash(): void {
    clearTimeout(this.flashTimer);
    this.hintFlash.set(null);
  }

  setShowStrokeOrder(value: boolean): void {
    this.showStrokeOrder = value;
    try {
      localStorage.setItem(SHOW_STROKE_ORDER_KEY, String(value));
    } catch { /* storage disabled — preference just won't persist */ }
  }

  onCardSolved(result: { exact: boolean }): void {
    this.emotes.trigger('correct');
    this.quizEngine.nextCard(true, result.exact);
  }

  onLabelClicked(event: { value: string; event: MouseEvent }): void {
    if (event.event.shiftKey) {
      console.log('Comparison requested for:', event.value);
      // TODO: build comparison card from deck data
    }
  }

  onHintHover(): void {
    this.emotes.peekHint();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    this.handleHotkeys(event);
  }

  private handleHotkeys(event: KeyboardEvent): void {
    if (event.ctrlKey && event.code === 'KeyH') {
      event.preventDefault();
      this.triggerHint();
    }
  }

  triggerHint(): void {
    if (this.modal.hasOpenHint()) this.modal.closeHint();
    if (!this.currentCard) return;

    this.emotes.trigger('hint');
    this.quizEngine.useHint();

    if (this.popout.active()) {
      this.flashAnswers();
    } else {
      this.modal.openHintModal(this.currentCard, 0).subscribe();
    }
  }

  private buildMode(): QuizMode {
    return {name: 'custom-order', questionFields: ['question'], answerFields: this.fieldOrder};
  }

  toggleReorder(): void {
    this.showReorder = !this.showReorder;
  }

  onReorder(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.fieldOrder, event.previousIndex, event.currentIndex);
    this.fieldOrderService.saveOrder(this.deckStore.deckId(), this.fieldOrder);
    if (this.currentCard) {
      this.currentSlots = cardToSlots(this.currentCard, this.buildMode(), this.deckStore.properties());
    }
  }

  takeOver(): void { void this.quizEngine.takeOverDeck(); }

  togglePopout(): void {
    if (this.popout.active()) {
      this.popout.close();
    } else {
      void this.popout.popOut(this.popoutHost.nativeElement);
    }
  }

  get levelRewindAvailable(): boolean {
    return this.quizEngine.deck.hasLevels;
  }

  /** Spread-out, deterministic hue per level (stable across reloads). */
  get levelHue(): number { return hueForLevel(this.currentLevel); }

  /** A character went into an answer field, main window or popout. Starts the clock. */
  onTyped(): void {
    this.timer.notifyTyping();
  }

  /**
   * Switch to Learn at the current card. Nothing here is reset: QuizEngine and
   * DeckStore are app-wide, so Learn's "Back to quiz" lands on this card again.
   */
  learnFromHere(): void {
    const deckKey = quizDeckKey(this.deckStore.deckId(), this.deckStore.deckName());
    if (!deckKey) return;

    // The board may be in the floating window. Close it, or that window would
    // keep showing a board that is no longer on screen anywhere.
    if (this.popout.active()) this.popout.close();

    this.timer.recordLearnSwitch();
    const state: LearnArrival = {
      deckName: this.deckStore.deckName(),
      startUid: this.quizEngine.currentEntry?.uid,
    };
    void this.router.navigate(['/learn', deckKey], {state});
  }
}


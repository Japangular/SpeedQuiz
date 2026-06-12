import {AfterViewInit, Component, HostListener, OnDestroy, TemplateRef, ViewChild, inject, ElementRef} from '@angular/core';
import {Subscription} from 'rxjs';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatIcon} from '@angular/material/icon';
import {MatAnchor, MatIconButton} from '@angular/material/button';
import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';

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
import {YoutubeDockComponent} from '../../../widgets/youtube-dock/youtube-dock.component';
import {SlotGroupComponent} from '../slots/slot-group/slot-group.component';
import {MatTooltip} from '@angular/material/tooltip';
import {QuizPopoutService} from '../popout/quiz-popout.service';
import {QuizSettingsService} from '../quiz-settings.service';

const SHOW_YOUTUBE_KEY = 'quiz_show_youtube';

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
    YoutubeDockComponent,
    MatTooltip,
    MatIconButton,
  ],
  templateUrl: './quiz-board.component.html',
  styleUrl: './quiz-board.component.css'
})
export class QuizBoardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('historyPanel') historyPanel!: TemplateRef<any>;
  @ViewChild('popoutHost') popoutHost!: ElementRef<HTMLElement>;

  popout = inject(QuizPopoutService);

  currentSlots: Slot[] = [];
  fieldOrder: string[] = [];
  showReorder = false;

  /** Default off; remembered across sessions. */
  showYoutube = localStorage.getItem(SHOW_YOUTUBE_KEY) === 'true';


  private lastDeckId?: string;
  private fieldOrderService = inject(FieldOrderService);

  private currentCard?: Card;
  private cardSub?: Subscription;
  private completedSub?: Subscription;
  private hotkeySub?: Subscription;

  private deckStore = inject(DeckStore);

  constructor(
    private quizEngine: QuizEngine,
    private modal: ModalService,
    private contextPanel: ContextPanelService,
    private settings: QuizSettingsService,
  ) {
    this.cardSub = this.quizEngine.card$.subscribe(card => {
      this.modal.closeHint();
      this.currentCard = card;

      const deckId = this.deckStore.deckId();
      if (deckId !== this.lastDeckId) {
        this.lastDeckId = deckId;
        this.settings.attachDeck(deckId);
        this.fieldOrder = this.fieldOrderService.orderedAnswerFields(deckId, this.deckStore.properties());
      }

      this.currentSlots = cardToSlots(card, this.buildMode(), this.deckStore.properties());
      this.hotkeySub = this.popout.keydown.subscribe(e => this.handleHotkeys(e));
    });

    this.completedSub = this.quizEngine.deckCompleted$.subscribe(() => {
      this.modal.openDeckCompletedModal([]).subscribe(result => {
        if (result === 'restart') {
          this.quizEngine.getDeckCommand().restart();
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
    this.contextPanel.clear();
  }

  setShowYoutube(value: boolean): void {
    this.showYoutube = value;
    try {
      localStorage.setItem(SHOW_YOUTUBE_KEY, String(value));
    } catch { /* storage disabled — preference just won't persist */
    }
  }

  onCardSolved(result: { exact: boolean }): void {
    this.quizEngine.nextCard(true, result.exact);
  }

  onLabelClicked(event: { value: string; event: MouseEvent }): void {
    if (event.event.shiftKey) {
      console.log('Comparison requested for:', event.value);
      // TODO: build comparison card from deck data
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    this.handleHotkeys(event);
  }

  private handleHotkeys(event: KeyboardEvent): void {
    if (event.ctrlKey && event.code === 'KeyH') {
      event.preventDefault();

      if (this.modal.hasOpenHint()) {       // closes the old
        this.modal.closeHint();
      }
      if (this.currentCard) {
        this.quizEngine.useHint();
        const autoCloseMs = this.popout.active() ? this.settings.hintAutoCloseSeconds() * 1000 : 0;                              // in-page: close manually, as before
        this.modal.openHintModal(this.currentCard, autoCloseMs).subscribe();
      }
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

  togglePopout(): void {
    if (this.popout.active()) {
      this.popout.close();
    } else {
      void this.popout.popOut(this.popoutHost.nativeElement);
    }
  }
}

import {AfterViewInit, Component, HostListener, inject, OnDestroy, TemplateRef, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatIcon} from '@angular/material/icon';
import {MatAnchor} from '@angular/material/button';

import {DeckBarComponent} from '../../deck-bar/deck-bar.component';
import {QuizHistorySidebarComponent} from '../../quiz-history-sidebar/quiz-history-sidebar.component';
import {SlotGroupComponent} from '../slots/slot-group.component';
import {ContextPanelService} from '../../../layout/side-nav/panel.service';
import {ModalService} from '../../../widgets/modal/modal.service';
import {QuizEngine} from './quiz-engine.service';
import {Slot} from '../model/slot.model';
import {cardToSlots} from '../model/card-to-slot.adapter';
import {Card} from '../model/quiz.model';
import {DeckStore} from '../../../store/deck.store';

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
  ],
  templateUrl: './quiz-board.component.html',
  styleUrl: './quiz-board.component.css'
})
export class QuizBoardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('historyPanel') historyPanel!: TemplateRef<any>;

  currentSlots: Slot[] = [];
  private currentCard?: Card;
  private cardSub?: Subscription;
  private completedSub?: Subscription;

  private deckStore = inject(DeckStore);

  constructor(
    private quizEngine: QuizEngine,
    private modal: ModalService,
    private contextPanel: ContextPanelService,
  ) {
    this.cardSub = this.quizEngine.card$.subscribe(card => {
      this.currentCard = card;
      this.currentSlots = cardToSlots(card, undefined, this.deckStore.properties());
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
    this.contextPanel.clear();
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
    if (event.ctrlKey && event.code === 'KeyH') {
      event.preventDefault();
      if (this.currentCard) {
        this.quizEngine.useHint();
        this.modal.openHintModal(this.currentCard).subscribe();
      }
    }
  }
}

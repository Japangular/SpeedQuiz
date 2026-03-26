import { AfterViewInit, Component, HostListener, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor } from '@angular/material/button';

import { DeckBarComponent } from '../../deck-bar/deck-bar.component';
import { QuizHistorySidebarComponent } from '../../quiz-history-sidebar/quiz-history-sidebar.component';
import { SlotGroupComponent } from '../slots/slot-group.component';
import { ContextPanelService } from '../../../layout/side-nav/panel.service';
import { ModalService } from '../../../widgets/modal/modal.service';
import { QuizBoardService } from './quiz-board.service';
import { Slot } from '../model/slot.model';
import {cardToSlots} from '../model/card-to-slot.adapter';
import {Card} from '../model/quiz.model';

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

  constructor(
    private quizBoard: QuizBoardService,
    private modal: ModalService,
    private contextPanel: ContextPanelService,
  ) {

    this.cardSub = this.quizBoard.card$.subscribe(card => {
      this.currentCard = card;
      this.currentSlots = cardToSlots(card);
    });
  }

  ngAfterViewInit(): void {
    Promise.resolve().then(() => {
      this.contextPanel.set(this.historyPanel, 'history', 'Recent cards');
    });
  }

  ngOnDestroy(): void {
    this.cardSub?.unsubscribe();
    this.contextPanel.clear();
  }

  onCardSolved(): void {
    this.quizBoard.nextCard(true);
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
        this.modal.openHintModal(this.currentCard).subscribe(result => {
          if (result === 'reset') {
            this.quizBoard.useHint();
          }
        });
      }
    }
    if (event.ctrlKey && event.code === 'KeyD') {
      event.preventDefault();
      this.modal.openDeckModal();
    }
  }
}

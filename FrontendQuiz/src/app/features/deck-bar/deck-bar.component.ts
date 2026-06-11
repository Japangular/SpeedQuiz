import {Component, EventEmitter, Input, Output, inject} from '@angular/core';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatChipsModule} from '@angular/material/chips';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {QuizEngine} from '../quiz/quiz-board/quiz-engine.service';
import {DeckStore} from '../../store/deck.store';

@Component({
  selector: 'app-deck-bar',
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatChipsModule,
    MatCard,
    MatCardTitle,
    MatIconButton,
    MatCardContent,
    MatTooltip,
    MatSlideToggle,
  ],
  templateUrl: './deck-bar.component.html',
  styleUrl: './deck-bar.component.css'
})
export class DeckBarComponent {
  private deckStore = inject(DeckStore);
  private quizEngine = inject(QuizEngine);

  deckName = this.deckStore.deckName;
  hasCards = this.deckStore.hasCards;

  @Input() canReorder = false;
  @Input() reorderActive = false;
  @Input() showYoutube = false;

  @Input() popoutSupported = false;
  @Input() popoutActive = false;
  @Output() popoutToggle = new EventEmitter<void>();

  @Output() reorderToggle = new EventEmitter<void>();
  @Output() showYoutubeChange = new EventEmitter<boolean>();

  resetDeck(): void {
    this.quizEngine.resetSession();
  }
}

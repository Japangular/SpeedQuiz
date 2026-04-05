import {Component, inject} from '@angular/core';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatChipsModule} from '@angular/material/chips';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {MatIconButton} from '@angular/material/button';
import {QuizEngine} from '../quiz/quiz-board/quiz-engine.service';
import {MatTooltip} from '@angular/material/tooltip';
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
  ],
  templateUrl: './deck-bar.component.html',
  styleUrl: './deck-bar.component.css'
})
export class DeckBarComponent {
  private deckStore = inject(DeckStore);
  private quizEngine = inject(QuizEngine);

  deckName = this.deckStore.deckName;
  hasCards = this.deckStore.hasCards;

  resetDeck(): void {
    this.quizEngine.resetSession();
  }
}

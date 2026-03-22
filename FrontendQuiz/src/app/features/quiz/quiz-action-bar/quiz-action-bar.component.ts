import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {QuizBoardService} from '../quiz-board/quiz-board.service';
import {DeckCommand} from '../utils/deck-iterator/deck-iterator.model';

@Component({
  selector: 'app-quiz-action-bar',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './quiz-action-bar.component.html',
  styleUrl: './quiz-action-bar.component.css'
})
export class QuizActionBarComponent {
  inputValue: string = '';

  deckCommand!: DeckCommand;

  constructor(protected deckIteratorService: QuizBoardService) {
    this.deckCommand = deckIteratorService.getDeckCommand();
  }

  nextCard(withoutHelp?: boolean) {
    if (withoutHelp === false) {
      this.deckCommand.useHint();
    }
    this.deckCommand.nextCard();
  }

  useHint() {
    this.deckCommand.useHint();
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.processInput();
    }
  }

  processInput() {
    const trimmedInput = this.inputValue.trim();
    if (!trimmedInput) return;
    this.inputValue = '';
  }
}

import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {QuizBoardService} from '../quiz-board/quiz-board.service';
import {DeckCommand} from '../utils/deck-iterator/deck-iterator.model';

@Component({
  selector: 'app-quiz-action-bar',
  imports: [
    FormsModule
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
    this.inputValue = ''; // Clear the input after emitting
  }
}

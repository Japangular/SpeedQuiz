import { Component } from '@angular/core';
import {QuizBoardService} from '../quizBoard/quiz-board.service';
import {FormsModule} from '@angular/forms';

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



  constructor(protected ms: QuizBoardService) {
  }

  nextCard(withoutHelp?: boolean) {
    if (withoutHelp === false) {
      this.ms.useHint();
    }
    this.ms.nextCard();
  }

  useHint() {
    this.ms.useHint();
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

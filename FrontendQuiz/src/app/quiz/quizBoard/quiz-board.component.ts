import { Component } from '@angular/core';
import {QuizBoardService} from './quiz-board.service';
import {AsyncPipe} from '@angular/common';
import {CardViewComponent} from '../card-view/card-view.component';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    AsyncPipe,
    CardViewComponent,
    FormsModule
  ],
  templateUrl: './quiz-board.component.html',
  styleUrl: './quiz-board.component.css'
})
export class QuizBoardComponent {
  inputValue: string = '';

  constructor(protected ms: QuizBoardService) { }

  nextCard(withoutHelp?: boolean){
    if(withoutHelp === false){
      this.ms.useHint();
    }
    this.ms.nextCard();
  }
  useHint(){
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

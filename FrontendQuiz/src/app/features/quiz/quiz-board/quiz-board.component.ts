import {Component} from '@angular/core';
import {QuizBoardService} from './quiz-board.service';
import {AsyncPipe} from '@angular/common';
import {CardViewComponent} from '../card-view/card-view.component';
import {FormsModule} from '@angular/forms';
import {QuizActionBarComponent} from '../quiz-action-bar/quiz-action-bar.component';
import {DeckCommand} from '../utils/deck-iterator/DeckIterator';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CardViewComponent,
    FormsModule,
    QuizActionBarComponent,
    AsyncPipe
  ],
  templateUrl: './quiz-board.component.html',
  styleUrl: './quiz-board.component.css'
})
export class QuizBoardComponent {
  constructor(protected deckIteratorService: QuizBoardService) { }
}

import {Component, HostListener} from '@angular/core';
import {CardViewComponent} from '../card-view/card-view.component';
import {FormsModule} from '@angular/forms';
import {QuizActionBarComponent} from '../quiz-action-bar/quiz-action-bar.component';
import {ModalService} from '../../../widgets/modal/modal.service';
import {DeckBarComponent} from '../../deck-bar/deck-bar.component';

@Component({
  selector: 'app-quiz-board',
  standalone: true,
  imports: [
    CardViewComponent,
    FormsModule,
    QuizActionBarComponent,
    DeckBarComponent,
  ],
  templateUrl: './quiz-board.component.html',
  styleUrl: './quiz-board.component.css'
})
export class QuizBoardComponent {
  constructor(private modal: ModalService) {
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {
    // Strg + D → deck modal
    if (event.ctrlKey && event.code === 'KeyD') {
      event.preventDefault();
      this.modal.openDeckModal();
    }
  }
}


import {Card} from "../quiz/quiz.model";
import {QuizComponent} from "../quiz/quiz.component";
import {NgIf} from "@angular/common";
import {Component, EventEmitter, Input, Output} from "@angular/core";
import {StrokeOrderKanjiComponent} from '../widget/kanji-stroke-order-grid/stroke-order-kanji.component';
import {OneLinerComponent, SelectedSubKanji} from '../widget/one-liner/one-liner.component';
import {QuizEvent} from '../utils/QuizUtils';
import {ModalService} from '../widget/modal/modal.service';

@Component({
  selector: 'app-card-view',
  standalone: true,
  imports: [
    OneLinerComponent,
    QuizComponent,
    StrokeOrderKanjiComponent,
    NgIf
  ],
  templateUrl: './card-view.component.html',
  styleUrl: './card-view.component.css'
})
export class CardViewComponent {
  @Input()
  currentCard?: Card | null;

  @Output()
  nextCard = new EventEmitter<boolean>();

  constructor(private modal: ModalService) {
  }

  getCard(): Card {
    return this.currentCard ?? {} as Card;
  }

  handleSelectedKanji($event: SelectedSubKanji) {

  }

  toggleHint($event: QuizEvent) {
    switch ($event) {
      case QuizEvent.CARD_SOLVED_WITH_HINT:
        this.nextCard.emit(false);
        break;
      case QuizEvent.CARD_SOLVED:
        this.nextCard.emit(true);
        break;
      case QuizEvent.HINT_PRESSED:
        this.modal.openHintModal({hintText: this.getCard().hint});

    }
  }
}

export interface SelectedQuizEvent {

}

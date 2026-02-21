import {Card} from "../answer-slots/quiz.model";
import {AnswerSlotsComponent} from "../answer-slots/answer-slots.component";
import {AsyncPipe, NgIf} from "@angular/common";
import {Component, EventEmitter, Input, Output} from "@angular/core";
import {QuizEvent} from '../utils/QuizUtils';
import {QuizBoardService} from '../quiz-board/quiz-board.service';
import {FilterAnswersPipe} from '../utils/filter-answers.pipe';
import {OneLinerComponent, SelectedSubKanji} from '../../../widgets/one-liner/one-liner.component';
import {StrokeOrderKanjiComponent} from '../../../widgets/kanji-stroke-order-grid/stroke-order-kanji.component';
import {hasKanji} from './card-view.model';

@Component({
  selector: 'app-card-view',
  standalone: true,
  imports: [
    OneLinerComponent,
    AnswerSlotsComponent,
    StrokeOrderKanjiComponent,
    NgIf,
    AsyncPipe,
    FilterAnswersPipe,
    OneLinerComponent,
    OneLinerComponent,
    StrokeOrderKanjiComponent,
    StrokeOrderKanjiComponent,
    StrokeOrderKanjiComponent
  ],
  templateUrl: './card-view.component.html',
  styleUrl: './card-view.component.css'
})
export class CardViewComponent {
  @Input()
  currentCard?: Card | null;
  @Output()
  nextCard = new EventEmitter<boolean>();
  @Input() enableZoom: boolean = true;

  constructor(protected deckIteratorService: QuizBoardService) {
  }

  handleSelectedKanji($event: SelectedSubKanji) {
    console.log("selectedSubKanji: " + JSON.stringify($event));
  }

  toggleHint(currentCard: Card, $event: QuizEvent) {
    switch ($event) {
      case QuizEvent.CARD_SOLVED_WITH_HINT:
        this.deckIteratorService.nextCard(false);
        break;
      case QuizEvent.CARD_SOLVED:
        this.deckIteratorService.nextCard(true);
        break;
      case QuizEvent.HINT_PRESSED:
        this.deckIteratorService.openHintModal(currentCard);

    }
  }

  isJapanese(currentCard: Card) {
    return currentCard.subjectType !== 'KANA_VOCABULARY' && currentCard.subjectType !== 'RADICAL' && hasKanji(currentCard.question);
  }

  handleStrokeOrderComplete() {

  }

}

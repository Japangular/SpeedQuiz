import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {Card} from "./quiz.model";
import {InputVerificationDirective} from '../utils/input-verification.directive';
import {LevenshteinStrategy, RomajiConversionStrategy, ValidationStrategy} from "../utils/ValidationStrategy";
import {LevenshteinService} from "../utils/levenshtein.service";
import {QuizEvent, QuizUtilCard, QuizUtils} from '../utils/QuizUtils';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [ReactiveFormsModule, InputVerificationDirective],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent extends QuizUtils {
  @ViewChild('readingInput') override readingInputElement!: ElementRef;
  @ViewChild('meaningInput') override meaningInputElement!: ElementRef;

  override _quizUtilCard?: QuizUtilCard;

  @Input()
  set quizUtilCard(card: Card){
    this._quizUtilCard = {
      correctMeaning: card.meaning,
      correctReading: card.reading
    } as QuizUtilCard;
    console.log(this._quizUtilCard);
  }

  @Output()
  emitQuizEvent: EventEmitter<QuizEvent> = new EventEmitter<QuizEvent>();

  constructor() {
    super();
  }

  createStrategy(strategy: STRATEGY): ValidationStrategy {
    if(strategy === STRATEGY.READING){
      return new RomajiConversionStrategy();
    } else if (strategy === STRATEGY.MEANING){
      return new LevenshteinStrategy();
    } else {
      throw new Error("wrong strategy");
    }
  }

  override handleSolvedCard(): void {
    if(this.cheated){
      this.cheated = false;
      this.hintPressed = false;
      this.emitQuizEvent.emit(QuizEvent.CARD_SOLVED_WITH_HINT);
    } else {
      this.emitQuizEvent.emit(QuizEvent.CARD_SOLVED);
    }
  }

  override handleHintPressed() {
    this.emitQuizEvent.next(QuizEvent.HINT_PRESSED);
  }

  protected readonly RomajiConversionStrategy = RomajiConversionStrategy;
  protected readonly LevenshteinService = LevenshteinService;
  protected readonly LevenshteinStrategy = LevenshteinStrategy;
  protected readonly STRATEGY = STRATEGY;
}

export enum STRATEGY {
  MEANING, READING
}

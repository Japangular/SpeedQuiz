import {Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {Card} from "./quiz.model";
import {InputVerificationDirective} from '../utils/input-verification.directive';
import {LevenshteinStrategy, RomajiConversionStrategy, ValidationStrategy} from "../utils/ValidationStrategy";
import {QuizEvent, QuizUtilCard, QuizUtils} from '../utils/QuizUtils';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [ReactiveFormsModule, InputVerificationDirective, NgForOf],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent extends QuizUtils {
  @ViewChildren('inputRef') inputRefs!: QueryList<ElementRef>;

  override _quizUtilCard?: QuizUtilCard;
  quizAnswerSlots: QuizAnswerSlot[] = [];

  @Input()
  set quizUtilCard(card: Card){
    this._quizUtilCard = {
      correctMeaning: card.meaning,
      correctReading: card.reading
    } as QuizUtilCard;

    this.quizAnswerSlots = [
      {
        name: 'reading',
        placeholder: 'Enter reading',
        correctAnswer: card.reading,
        strategy: this.createStrategy(STRATEGY.READING),
        autofocus: true,
        onCorrectAnswer: (isCorrect) => this.readingCorrect(isCorrect),
      },
      {
        name: 'meaning',
        placeholder: 'Enter meaning',
        correctAnswer: card.meaning,
        strategy: this.createStrategy(STRATEGY.MEANING),
        onCorrectAnswer: (isCorrect) => this.meaningCorrect(isCorrect),
      },
    ];

    const controls: Record<string, FormControl<string | null>> = {};
    this.quizAnswerSlots.forEach(slot => {
      controls[slot.name] = new FormControl('');
    });
    this.cardForm = new FormGroup(controls);

  // Wait for the view to update before focusing
  setTimeout(() => {
    const inputToFocus = this.getInputElementByName('reading');
    inputToFocus?.nativeElement.focus();
  });

  console.log(this._quizUtilCard);
}

  @Output()
  emitQuizEvent: EventEmitter<QuizEvent> = new EventEmitter<QuizEvent>();

  constructor() {
    super();
  }

  override getSlots(): QuizAnswerSlot[] {
    return this.quizAnswerSlots;
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
}

export enum STRATEGY {
  MEANING, READING
}

export interface QuizAnswerSlot {
  name: string; // 'reading', 'meaning', etc.
  placeholder: string;
  correctAnswer: string;
  strategy: ValidationStrategy;
  autofocus?: boolean;
  onCorrectAnswer?: (correct: boolean) => void;
}

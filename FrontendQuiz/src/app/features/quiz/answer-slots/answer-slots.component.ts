import {Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {AnswerCheckStrategy, AnswersMap, QUIZ_ANSWER_SLOTS, QuizAnswerSlot} from "./quiz.model";
import {InputVerificationDirective} from '../utils/input-verification.directive';
import {LevenshteinStrategy, RomajiConversionStrategy, ValidationStrategy} from "../utils/ValidationStrategy";
import {QuizEvent, QuizUtils} from '../utils/QuizUtils';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-answer-slots',
  standalone: true,
  imports: [ReactiveFormsModule, InputVerificationDirective, NgForOf],
  templateUrl: './answer-slots.component.html',
  styleUrls: ['./answer-slots.component.css']
})
export class AnswerSlotsComponent extends QuizUtils {
  @ViewChildren('inputRef') inputRefs!: QueryList<ElementRef>;

  quizAnswerSlots: QuizAnswerSlot[] = [];

  @Input()
  set quizUtilCard(card: AnswersMap){
    this.quizAnswerSlots = QUIZ_ANSWER_SLOTS(card, this);

    const controls: Record<string, FormControl<string | null>> = {};

    this.quizAnswerSlots.forEach(slot => {
      controls[slot.name] = new FormControl('');
    });

    this.cardForm = new FormGroup(controls);

    this.isEverythingCorrect = new Array(this.getSlots().length).fill(false)

  // Wait for the view to update before focusing
  setTimeout(() => {
    const inputToFocus = this.getInputElementByIndex(0);
    inputToFocus?.nativeElement.focus();
  });
}

  @Output()
  emitQuizEvent: EventEmitter<QuizEvent> = new EventEmitter<QuizEvent>();

  constructor() {
    super();
  }

  override getSlots(): QuizAnswerSlot[] {
    return this.quizAnswerSlots;
  }

  createStrategy(strategy: AnswerCheckStrategy): ValidationStrategy {
    if(strategy === AnswerCheckStrategy.EXACT_HIRAGANA_MATCH){
      return new RomajiConversionStrategy();
    } else if (strategy === AnswerCheckStrategy.LEVENSHTEIN_DISTANCE){
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

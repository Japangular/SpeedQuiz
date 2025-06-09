import {FormControl, FormGroup} from "@angular/forms";
import {ElementRef, EventEmitter, QueryList} from "@angular/core";
import {AnswerHandler, QuizAnswerSlot} from '../answer-slots/quiz.model';

export abstract class QuizUtils implements AnswerHandler{
  abstract emitQuizEvent: EventEmitter<QuizEvent>;
  abstract inputRefs: QueryList<ElementRef>;

  abstract handleSolvedCard(): void;
  abstract handleHintPressed(): void;
  abstract getSlots(): QuizAnswerSlot[];

  hintPressed = false;
  cheated = false;
  isEverythingCorrect!: boolean[];

  cardForm: FormGroup<CardFormStructure> = new FormGroup({});

  toggleHint(event: KeyboardEvent) {
    if (event.key === 'ß') {
      event.preventDefault();
      this.hintPressed = !this.hintPressed;
      this.cheated = true;
      this.handleHintPressed();
    }
  }

  handleAnswerCorrect(i: number, isCorrect: boolean): void {
    this.isEverythingCorrect[i] = isCorrect;

    if (isCorrect) {
      // Focus the next unanswered input (skipping already correct ones)
      for (let j = 0; j < this.isEverythingCorrect.length; j++) {
        if (!this.isEverythingCorrect[j]) {
          const nextInput = this.getInputElementByIndex(j);
          nextInput?.nativeElement.focus();
          return;
        }
      }
      // If all are correct, check if the card is solved
      this.checkSolved();
    } else {
      // If not correct, don't change focus — possibly stay or give feedback
      console.log("fertig");
    }
  }

  checkSolved() {
    if (this.isSolved()) {
      this.isEverythingCorrect = new Array(this.getSlots().length).fill(false);
      this.resetFormGroup();
      this.handleSolvedCard();
    }
  }

  isSolved(): boolean {
    return this.isEverythingCorrect.every(value => value);
  }

  resetFormGroup() {
    const newControls = Object.fromEntries(
      this.getSlots().map(slot => [slot.name, new FormControl('')])
    );
    this.cardForm = new FormGroup(newControls);
  }

  getInputElementByIndex(index: number): ElementRef | undefined {
    return this.inputRefs.get(index);
  }
}

export interface CardFormStructure {
  [key: string]: FormControl<string | null>;
}

export enum QuizEvent {
  HINT_PRESSED, CARD_SOLVED, CARD_SOLVED_WITH_HINT
}

export interface QuizUtilCard {
  answers: string[];
}

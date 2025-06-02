import {FormControl, FormGroup} from "@angular/forms";
import {ElementRef, EventEmitter, QueryList} from "@angular/core";
import {QuizAnswerSlot} from '../dualInputCard/quiz.component';

export abstract class QuizUtils {
  abstract emitQuizEvent: EventEmitter<QuizEvent>;

  abstract inputRefs: QueryList<ElementRef>;

  abstract _quizUtilCard?: QuizUtilCard;
  abstract handleSolvedCard(): void;
  abstract handleHintPressed(): void;

  abstract getSlots(): QuizAnswerSlot[];

  hintPressed = false;
  cheated = false;
  isReadingCorrect = false;
  isMeaningCorrect = false;

  cardForm: FormGroup<CardFormStructure> = new FormGroup({});

  toggleHint(event: KeyboardEvent) {
    if (event.key === 'ß') {
      event.preventDefault();
      this.hintPressed = !this.hintPressed;
      this.cheated = true;
      this.handleHintPressed();
    }
  }

  readingCorrect(readingCorrect: boolean): void {
    this.isReadingCorrect = readingCorrect;

    if (readingCorrect && !this.isMeaningCorrect) {
      const meaningInput = this.getInputElementByName('meaning');
      meaningInput?.nativeElement.focus(); // Safe access
    } else {
      this.checkSolved();
    }
  }

  meaningCorrect(meaningCorrect: boolean): void {
    this.isMeaningCorrect = meaningCorrect;

    const readingInput = this.getInputElementByName('reading');
    if (!this.isReadingCorrect && meaningCorrect) {
      readingInput?.nativeElement.focus(); // Safe access
    } else {
      this.checkSolved();
    }
  }

  checkSolved() {
    if (this.isSolved()) {
      this.isReadingCorrect = false;
      this.isMeaningCorrect = false;
      this.resetFormGroup();
      this.handleSolvedCard();
    }
  }

  isSolved(): boolean {
    return this.isMeaningCorrect && this.isReadingCorrect;
  }

  resetFormGroup() {
    const newControls = Object.fromEntries(
      this.getSlots().map(slot => [slot.name, new FormControl('')])
    );
    this.cardForm = new FormGroup(newControls);
  }

  getInputElementByName(name: string): ElementRef | undefined {
    return this.inputRefs.find(el =>
      el.nativeElement.getAttribute('data-name') === name
    );
  }
}

export interface CardFormStructure {
  [key: string]: FormControl<string | null>;
}

export enum QuizEvent {
  HINT_PRESSED, CARD_SOLVED, CARD_SOLVED_WITH_HINT
}

export interface QuizUtilCard {
  correctReading: string;
  correctMeaning: string;
}

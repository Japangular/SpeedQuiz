import {FormControl, FormGroup} from "@angular/forms";
import {ElementRef, EventEmitter} from "@angular/core";
import {Card} from '../quiz/quiz.model';

export abstract class QuizUtils {
  abstract set quizUtilCard(card: Card);
  abstract emitQuizEvent: EventEmitter<QuizEvent>;

  abstract readingInputElement: ElementRef;
  abstract meaningInputElement: ElementRef;

  abstract _quizUtilCard?: QuizUtilCard;
  abstract handleSolvedCard(): void;
  abstract handleHintPressed(): void;

  hintPressed = false;
  cheated = false;
  isReadingCorrect = false;
  isMeaningCorrect = false;

  cardForm: FormGroup<CardFormStructure> = new FormGroup({
    reading: new FormControl(''),
    meaning: new FormControl('')
  });

  toggleHint(event: KeyboardEvent) {
    if (event.key === 'ß') {
      event.preventDefault();
      this.hintPressed = !this.hintPressed;
      this.cheated = true;
     this.handleHintPressed()
    }
  }

  getHiraganaAnswer(): string {
    return this._quizUtilCard?.correctReading ?? "";
  }

  getMeaningAnswer(): string {
    return this._quizUtilCard?.correctMeaning ?? "";
  }

  readingCorrect(readingCorrect: boolean): void {
    this.isReadingCorrect = readingCorrect;
    if(readingCorrect && !this.isMeaningCorrect){
      this.meaningInputElement.nativeElement.focus();
    } else {
      this.checkSolved();
    }
  }

  meaningCorrect(meaningCorrect: boolean): void {
    this.isMeaningCorrect = meaningCorrect;
    if (!this.isReadingCorrect && this.isMeaningCorrect) {
      this.readingInputElement.nativeElement.focus();
    } else {
      this.checkSolved();
    }
  }

  checkSolved(){
    if(this.isSolved()){
      this.readingInputElement.nativeElement.focus();
      this.isReadingCorrect = false;
      this.isMeaningCorrect = false;
      this.resetFormGroup();
      this.handleSolvedCard();
    }
  }

  isSolved(): boolean {
    return this.isMeaningCorrect && this.isReadingCorrect;
  }

  resetFormGroup(){
    this.cardForm = new FormGroup({
      reading: new FormControl(''),
      meaning: new FormControl('')
    });
  }
}

export interface CardFormStructure {
  reading: FormControl<string | null>;
  meaning: FormControl<string | null>;
}

export enum QuizEvent {
  HINT_PRESSED, CARD_SOLVED, CARD_SOLVED_WITH_HINT
}

export interface QuizUtilCard {
  correctReading: string;
  correctMeaning: string;
}

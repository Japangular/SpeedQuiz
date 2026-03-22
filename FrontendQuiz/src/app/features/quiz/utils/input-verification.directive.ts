import {ChangeDetectorRef, Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged, Subscription} from 'rxjs';
import {ValidationStrategy} from "./ValidationStrategy";

@Directive({
  selector: '[directiveReadingMeaning]',
  standalone: true
})
export class InputVerificationDirective implements OnInit, OnDestroy {
  @Input() readingNotMeaning: boolean = false;
  private _correctAnswer: string = '';
  @Output() onCorrectAnswer: EventEmitter<boolean> = new EventEmitter<boolean>();

  formControl = new FormControl();
  private valueChangesSubscription!: Subscription;

  constructor(private el: ElementRef<HTMLInputElement>, private cdr: ChangeDetectorRef) {
  }

  @Input() strategy!: ValidationStrategy;

  @Input()
  set correctAnswer(correctAnswer: string) {
    this._correctAnswer = correctAnswer || '';
    this.el.nativeElement.value = "";
    this.cdr.detectChanges();
  }

  get correctAnswer(): string {
    return this._correctAnswer;
  }

  ngOnInit() {
    this.valueChangesSubscription = this.formControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(
      inputValue => {

        const transformedValue = this.strategy.transformInput ? this.strategy.transformInput(inputValue) : inputValue;

        if (transformedValue !== inputValue) {
          this.el.nativeElement.value = transformedValue;
        }

        const isCorrect = this.strategy.validate(transformedValue, this.correctAnswer);
        this.onCorrectAnswer.emit(isCorrect);
      }
    );

    this.el.nativeElement.addEventListener('input', () => {
      this.formControl.setValue(this.el.nativeElement.value, {emitEvent: false});
    });
  }

  @HostListener('keyup') onKeyUp() {
    this.formControl.setValue(this.el.nativeElement.value);
  }

  ngOnDestroy() {
    if (this.valueChangesSubscription) {
      this.valueChangesSubscription.unsubscribe();
    }
  }
}

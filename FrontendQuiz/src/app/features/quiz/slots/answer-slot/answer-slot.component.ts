import {Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild, inject} from '@angular/core';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {Subscription, debounceTime, distinctUntilChanged, skip, tap} from 'rxjs';
import { ValidatorFn, isAnswerPrefix, validatorForField } from '../../model/validation';
import { RenderHint } from '../../model/slot.model';
import {
  StrokeOrderKanjiComponent
} from '../../../../widgets/kanji-stroke-order-grid/stroke-order-kanji.component';
import {QuizSettingsService} from '../../quiz-settings.service';

export interface AnswerResult {
  fieldName: string;
  correct: boolean;
  exact?: boolean;
}

@Component({
  selector: 'app-answer-slot',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    StrokeOrderKanjiComponent,
  ],
  templateUrl: './answer-slot.component.html',
  styleUrl: './answer-slot.component.css'
})
export class AnswerSlotComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) correctAnswer!: string;
  @Input({ required: true }) fieldName!: string;
  @Input() renderHint?: RenderHint;
  @Input() validator?: ValidatorFn;
  @Input() propertyType?: string;

  @Output() result = new EventEmitter<AnswerResult>();

  @ViewChild('inputRef') inputRef?: ElementRef<HTMLInputElement>;

  control = new FormControl('');

  private resolved = false;

  /** True while a wrong attempt is on its way out; drives the fade in the template. */
  fading = false;
  private clearTimer?: ReturnType<typeof setTimeout>;

  // Declaration order matters: `settings` must be initialised before
  // `debounceMs$` reads it. Field initialisers run in an injection context,
  // which is what toObservable() requires — calling it from ngOnInit or
  // ngOnChanges instead throws NG0203.
  private settings = inject(QuizSettingsService);
  private debounceMs$ = toObservable(this.settings.hiraganaDebounceMs);

  /**
   * The valueChanges pipe is torn down and rebuilt whenever the card changes
   * or the debounce setting changes, so it is tracked by hand.
   */
  private subscription?: Subscription;

  constructor() {
    // The settings stream, by contrast, lives exactly as long as the
    // component does — so takeUntilDestroyed() handles teardown and there is
    // nothing to track manually. Subscribing here (once, in the constructor)
    // rather than inside setupSubscription() is the whole point: the old
    // version re-subscribed on every ngOnChanges, i.e. once per card, and
    // never unsubscribed any of them.
    this.debounceMs$.pipe(
      skip(1),                  // toObservable replays the current value on subscribe
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe(() => {
      // Rebuild so the new debounce takes effect without needing a card change.
      if (!this.resolved) {
        this.setupSubscription();
      }
    });
  }

  get effectiveRenderHint(): RenderHint {
    return this.renderHint ?? 'text';
  }

  ngOnInit(): void {
    // Angular fires ngOnChanges before ngOnInit whenever an input is bound, so
    // this is usually the second call. setupSubscription() is idempotent, so
    // the redundant call is harmless; it stays as a guard for the case where
    // the component is created with no bound inputs at all.
    this.setupSubscription();
  }

  ngOnChanges(): void {
    this.resolved = false;
    this.cancelClear();
    this.control.reset('');
    this.setupSubscription();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.cancelClear();
  }

  /** Fade duration = the clear delay, so the text runs out exactly when it is removed. */
  get clearMs(): number {
    return this.settings.wrongAnswerClearMs();
  }

  /** Idempotent: always replaces any previously active valueChanges subscription. */
  private setupSubscription(): void {
    this.subscription?.unsubscribe();

    const validatorFn = this.validator ?? validatorForField(this.fieldName, this.propertyType);
    const debounceMs = this.settings.hiraganaDebounceMs();

    this.subscription = this.control.valueChanges.pipe(
      // BEFORE the debounce, so it sees every raw keystroke: typing again is
      // what rescues an attempt from being cleared.
      tap(() => this.cancelClear()),
      debounceTime(debounceMs),
      distinctUntilChanged(),
    ).subscribe(input => {
      if (this.resolved || !input) return;

      const result = validatorFn(input, this.correctAnswer);

      if (result.transformedInput && result.transformedInput !== input) {
        // Write through the FormControl rather than poking nativeElement.value.
        // The old version left the control holding the raw romaji while the DOM
        // showed the transformed kana, so the next keystroke re-sent text the
        // user could no longer see. emitEvent:false keeps this from re-entering
        // the subscription we are currently inside.
        this.control.setValue(result.transformedInput, { emitEvent: false });
      }

      if (result.correct) {
        this.resolved = true;
        this.result.emit({ fieldName: this.fieldName, correct: true, exact: result.exact });
        return;
      }

      this.scheduleClear(result.transformedInput ?? input);
    });
  }

  /**
   * The attempt was checked and is wrong: empty the field after a second,
   * separate delay so the next guess can be typed without deleting this one.
   *
   * Not armed while the text is still the beginning of a correct answer — a
   * pause mid-word is not a wrong attempt, and wiping it would punish slow
   * typing rather than wrong answers.
   */
  private scheduleClear(shown: string): void {
    const ms = this.settings.wrongAnswerClearMs();
    if (ms <= 0) return;
    if (isAnswerPrefix(shown, this.correctAnswer)) return;

    this.fading = true;
    this.clearTimer = setTimeout(() => {
      this.clearTimer = undefined;
      this.fading = false;
      if (this.resolved) return;
      // emitEvent stays on (unlike the kana write-back above): the '' has to
      // travel through distinctUntilChanged, otherwise retyping the very same
      // guess would be swallowed as "unchanged" and never checked again.
      this.control.setValue('');
    }, ms);
  }

  private cancelClear(): void {
    if (this.clearTimer !== undefined) {
      clearTimeout(this.clearTimer);
      this.clearTimer = undefined;
    }
    this.fading = false;
  }

  onStrokeResult(correct: boolean): void {
    if (correct && !this.resolved) {
      this.resolved = true;
      this.result.emit({ fieldName: this.fieldName, correct: true });
    }
  }

  /** Called by parent when moving to next card — resets the input. */
  reset(): void {
    this.cancelClear();
    this.control.reset('');
    this.resolved = false;
  }

  /** Focus the input element (for auto-focus on first slot). */
  focus(): void {
    this.inputRef?.nativeElement?.focus();
  }
}


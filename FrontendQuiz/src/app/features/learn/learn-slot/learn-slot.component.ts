import {AfterViewInit, Component, DestroyRef, ElementRef, computed, inject, input, output, signal, viewChild} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {MatInput} from '@angular/material/input';
import {debounce, timer} from 'rxjs';

import {isKanaField, validatorForField} from '../../quiz/model/validation';
import {QuizSettingsService} from '../../quiz/quiz-settings.service';
import {ghostFor} from '../ghost';

let nextId = 0;

/**
 * One answer field in learn mode: the answer is drawn in grey behind the
 * input, and the user types over it.
 *
 * A typo clears itself like a wrong attempt in the quiz: the text fades over
 * the quiz's clear delay and the field empties, so the user waits a moment
 * and types the whole answer again. Text that can still become the answer is
 * never cleared; with the answer on screen there is nothing to give away.
 *
 * Deliberately not a mode of AnswerSlotComponent. The two share the answer
 * rules (validation.ts) and the timing settings, nothing else, so either can
 * change without the other.
 *
 * Expects a fresh instance per card (the board keys the @for by step), so
 * there is no reset path.
 */
@Component({
  selector: 'app-learn-slot',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormField, MatLabel, MatSuffix, MatInput, MatIcon],
  templateUrl: './learn-slot.component.html',
  styleUrl: './learn-slot.component.css',
})
export class LearnSlotComponent implements AfterViewInit {
  readonly answer = input.required<string>();
  readonly fieldName = input.required<string>();
  readonly propertyType = input<string>();
  readonly autofocus = input(false);

  /** Typed in full. Emitted once. */
  readonly solved = output<void>();

  readonly control = new FormControl('', {nonNullable: true});
  /**
   * What the field displays, updated on every `input` event. valueChanges
   * would lag behind an IME, which only commits at the end of composition,
   * and the ghost has to line up with the text actually on screen.
   */
  readonly shown = signal('');
  readonly done = signal(false);
  /** A typo is on its way out; drives the fade in the template. */
  readonly fading = signal(false);

  /** Screen readers get the answer from here; the grey text is visual only. */
  readonly answerId = `learn-answer-${nextId++}`;

  private readonly kana = computed(() => isKanaField(this.fieldName(), this.propertyType()));
  readonly ghost = computed(() => ghostFor(this.shown(), this.answer(), this.kana()));

  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('inputRef');
  protected readonly settings = inject(QuizSettingsService);
  private clearTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Same "finished typing" delay as the quiz; debounce() re-reads the
    // setting on every keystroke, so changing it takes effect immediately.
    this.control.valueChanges.pipe(
      debounce(() => timer(this.settings.hiraganaDebounceMs())),
      takeUntilDestroyed(),
    ).subscribe(value => this.check(value));

    inject(DestroyRef).onDestroy(() => this.cancelClear());
  }

  ngAfterViewInit(): void {
    if (this.autofocus()) this.focus();
  }

  focus(): void {
    this.inputRef().nativeElement.focus();
  }

  onInput(event: Event): void {
    // Every keystroke, IME composition included: typing again rescues the text.
    this.cancelClear();
    this.shown.set((event.target as HTMLInputElement).value);
  }

  private check(value: string): void {
    if (this.done() || !value.trim()) return;

    const result = validatorForField(this.fieldName(), this.propertyType())(value, this.answer());
    const shown = result.transformedInput ?? value;
    if (shown !== value) {
      // Kana write-back, as in the quiz. emitEvent: false keeps it out of the
      // pipe above; `shown` is set by hand because no input event fires.
      this.control.setValue(shown, {emitEvent: false});
      this.shown.set(shown);
    }

    if (result.correct) {
      this.done.set(true);
      this.solved.emit();
      return;
    }

    // Same test that hides the grey rest, so the field only clears once the
    // user can already see the text has gone wrong.
    if (!this.ghost().onTrack) this.scheduleClear();
  }

  /** Fade over the quiz's clear delay, then empty the field. 0 in settings turns it off. */
  private scheduleClear(): void {
    const ms = this.settings.wrongAnswerClearMs();
    if (ms <= 0) return;

    this.cancelClear();
    this.fading.set(true);
    this.clearTimer = setTimeout(() => {
      this.clearTimer = undefined;
      this.fading.set(false);
      if (this.done()) return;
      this.control.setValue('', {emitEvent: false});
      this.shown.set('');
    }, ms);
  }

  private cancelClear(): void {
    if (this.clearTimer !== undefined) {
      clearTimeout(this.clearTimer);
      this.clearTimer = undefined;
    }
    this.fading.set(false);
  }
}

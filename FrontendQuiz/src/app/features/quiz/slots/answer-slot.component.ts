import {
  Component, ElementRef, EventEmitter, Input, OnDestroy,
  OnInit, Output, ViewChild
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { ValidatorFn, validatorForField } from '../model/validation';
import { RenderHint } from '../model/slot.model';
import {
  StrokeOrderKanjiComponent
} from '../../../widgets/kanji-stroke-order-grid/stroke-order-kanji.component';

export interface AnswerResult {
  fieldName: string;
  correct: boolean;
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
  template: `
    @switch (effectiveRenderHint) {
      @case ('stroke-order') {
        <app-stroke-order-kanji
          [japanese]="correctAnswer"
          [isWrapContent]="false"
          (emitStrokeOrderComplete)="onStrokeResult($event)">
        </app-stroke-order-kanji>
      }
      @default {
        <mat-form-field appearance="outline">
          <mat-label>Enter {{ fieldName }}</mat-label>
          <input matInput
                 #inputRef
                 [formControl]="control"
                 [placeholder]="'Enter ' + fieldName" />
        </mat-form-field>
      }
    }
  `,
  styles: [`
    :host { display: block; }
    mat-form-field { width: 300px; }
  `]
})
export class AnswerSlotComponent implements OnInit, OnDestroy {
  @Input({ required: true }) correctAnswer!: string;
  @Input({ required: true }) fieldName!: string;
  @Input() renderHint?: RenderHint;
  @Input() validator?: ValidatorFn;

  @Output() result = new EventEmitter<AnswerResult>();

  @ViewChild('inputRef') inputRef?: ElementRef<HTMLInputElement>;

  control = new FormControl('');
  private subscription?: Subscription;
  private resolved = false;

  get effectiveRenderHint(): RenderHint {
    return this.renderHint ?? 'text';
  }

  ngOnInit(): void {
    const validatorFn = this.validator ?? validatorForField(this.fieldName);

    this.subscription = this.control.valueChanges.pipe(debounceTime(300), distinctUntilChanged(),).subscribe(input => {
      if (this.resolved || !input) return;

      const result = validatorFn(input, this.correctAnswer);

      // Apply transformation (romaji → hiragana)
      if (result.transformedInput && result.transformedInput !== input) {
        this.inputRef?.nativeElement && (this.inputRef.nativeElement.value = result.transformedInput);
      }

      if (result.correct) {
        this.resolved = true;
        this.result.emit({ fieldName: this.fieldName, correct: true });
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onStrokeResult(correct: boolean): void {
    if (correct && !this.resolved) {
      this.resolved = true;
      this.result.emit({ fieldName: this.fieldName, correct: true });
    }
  }

  /** Called by parent when moving to next card — resets the input. */
  reset(): void {
    this.control.reset('');
    this.resolved = false;
  }

  /** Focus the input element (for auto-focus on first slot). */
  focus(): void {
    this.inputRef?.nativeElement?.focus();
  }
}

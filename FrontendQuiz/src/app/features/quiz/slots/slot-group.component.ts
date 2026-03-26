import {
  Component, EventEmitter, Input, Output, QueryList,
  ViewChildren, AfterViewInit
} from '@angular/core';
import {Slot} from '../model/slot.model';
import {DisplaySlotComponent} from './display-slot.component';
import {AnswerSlotComponent, AnswerResult} from './answer-slot.component';
import {StrokeOrderKanjiComponent} from '../../../widgets/kanji-stroke-order-grid/stroke-order-kanji.component';

@Component({
  selector: 'app-slot-group',
  standalone: true,
  imports: [DisplaySlotComponent, AnswerSlotComponent, AnswerSlotComponent, StrokeOrderKanjiComponent],
  template: `
    @for (slot of slots; track $index) {
      @if (slot.role === 'display') {
        <app-display-slot
          [value]="slot.value"
          [renderHint]="slot.renderHint"
          [fieldName]="slot.fieldName"
          (labelClick)="onLabelClick($event)"/>
      } @else {
        <app-answer-slot
          [correctAnswer]="slot.value"
          [fieldName]="slot.fieldName ?? 'answer'"
          [renderHint]="slot.renderHint"
          (result)="onAnswerResult($index, $event)"/>
      }
    }

    @if (showStrokeOrder && strokeOrderKanji.length > 0) {
      <div class="stroke-order-row">
        @for (kanji of strokeOrderKanji; track kanji) {
          <app-stroke-order-kanji
            [japanese]="kanji"
            [isWrapContent]="false"/>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 1rem 2rem;
    }

    .stroke-order-row {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
  `]
})
export class SlotGroupComponent implements AfterViewInit {
  @Input({required: true}) slots: Slot[] = [];
  @Input() showStrokeOrder = true;

  @Output() allSolved = new EventEmitter<void>();
  @Output() labelClicked = new EventEmitter<{ value: string; event: MouseEvent }>();

  @ViewChildren(AnswerSlotComponent) answerSlots!: QueryList<AnswerSlotComponent>;

  private solvedSet = new Set<number>();
  private answerCount = 0;

  ngAfterViewInit(): void {
    // Focus the first answer slot
    setTimeout(() => {
      this.answerSlots.first?.focus();
    });
  }

  /** Called when slots input changes (new card). */
  ngOnChanges(): void {
    this.solvedSet.clear();
    this.answerCount = this.slots.filter(s => s.role === 'answer').length;
    // Reset all answer inputs
    this.answerSlots?.forEach(slot => slot.reset());
    // Re-focus first slot
    setTimeout(() => this.answerSlots?.first?.focus());
  }

  onAnswerResult(slotIndex: number, result: AnswerResult): void {
    if (result.correct) {
      this.solvedSet.add(slotIndex);

      if (this.solvedSet.size >= this.answerCount) {
        this.allSolved.emit();
      } else {
        // Focus next unsolved answer slot
        this.focusNextUnsolved(slotIndex);
      }
    }
  }

  onLabelClick(event: { value: string; event: MouseEvent }): void {
    this.labelClicked.emit(event);
  }

  /**
   * Stroke order kanji: extract distinct kanji characters from all display slots.
   * Replaces the old hasKanji() + StrokeOrderKanjiComponent logic.
   */
  get strokeOrderKanji(): string[] {
    const CJK = /[\u3400-\u4DBF\u4E00-\u9FFF]/g;
    const allDisplayText = this.slots
      .filter(s => s.role === 'display')
      .map(s => s.value)
      .join('');
    const matches = allDisplayText.match(CJK);
    return matches ? [...new Set(matches)] : [];
  }

  private focusNextUnsolved(afterIndex: number): void {
    const answerSlotArray = this.answerSlots.toArray();
    // Map slot indices to answer-slot component indices
    let answerIdx = 0;
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i].role === 'answer') {
        if (i > afterIndex && !this.solvedSet.has(i)) {
          answerSlotArray[answerIdx]?.focus();
          return;
        }
        answerIdx++;
      }
    }
    // Wrap around — focus first unsolved
    answerIdx = 0;
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i].role === 'answer') {
        if (!this.solvedSet.has(i)) {
          answerSlotArray[answerIdx]?.focus();
          return;
        }
        answerIdx++;
      }
    }
  }
}

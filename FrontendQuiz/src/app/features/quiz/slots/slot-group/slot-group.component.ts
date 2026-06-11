import {AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, QueryList, ViewChildren} from '@angular/core';
import {Slot} from '../../model/slot.model';
import {StrokeOrderKanjiComponent} from '../../../../widgets/kanji-stroke-order-grid/stroke-order-kanji.component';
import {DisplaySlotComponent} from '../display-slot/display-slot.component';
import {AnswerResult, AnswerSlotComponent} from '../answer-slot/answer-slot.component';

@Component({
  selector: 'app-slot-group',
  standalone: true,
  imports: [DisplaySlotComponent, AnswerSlotComponent, StrokeOrderKanjiComponent],
  templateUrl: './slot-group.component.html',
  styleUrl: './slot-group.component.css'
})
export class SlotGroupComponent implements AfterViewInit, OnChanges {
  @Input({required: true}) slots: Slot[] = [];
  @Input() showStrokeOrder = true;

  @Output() allSolved = new EventEmitter<{ exact: boolean }>();
  @Output() labelClicked = new EventEmitter<{ value: string; event: MouseEvent }>();

  @ViewChildren(AnswerSlotComponent) answerSlots!: QueryList<AnswerSlotComponent>;

  private solvedSet = new Set<number>();
  private answerCount = 0;
  private allExact = true;

  ngAfterViewInit(): void {
    // Focus the first answer slot
    setTimeout(() => {
      this.answerSlots.first?.focus();
    });
  }

  /** Called when slots input changes (new card). */
  ngOnChanges(): void {
    this.solvedSet.clear();
    this.allExact = true;
    this.answerCount = this.slots.filter(s => s.role === 'answer').length;
    // Reset all answer inputs
    this.answerSlots?.forEach(slot => slot.reset());
    // Re-focus first slot
    setTimeout(() => this.answerSlots?.first?.focus());
  }

  onAnswerResult(slotIndex: number, result: AnswerResult): void {
    if (result.correct) {
      this.solvedSet.add(slotIndex);
      if (result.exact === false) this.allExact = false;

      if (this.answerCount > 0 && this.solvedSet.size >= this.answerCount) {
        this.allSolved.emit({ exact: this.allExact });
      } else {
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

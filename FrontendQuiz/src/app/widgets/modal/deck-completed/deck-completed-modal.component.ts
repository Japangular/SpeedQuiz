import {DatePipe} from '@angular/common';
import {Component, Inject} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {MatIcon} from '@angular/material/icon';
import {Card} from '../../../features/quiz/model/quiz.model';
import {DeckRunRecord, DeckRunResult, formatDuration} from '../../../features/quiz/deck-timer.service';
import {cardOrderLabel} from '../../../features/quiz/utils/quiz-session/sort-strategy';

@Component({
  selector: 'app-deck-completed',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatIcon,
    DatePipe,
],
  templateUrl: './deck-completed-modal.component.html',
  styleUrl: './deck-completed-modal.component.css'
})
export class DeckCompletedModalComponent {
  solvedQuestions: string[];
  /** Undefined when no clock was running (read-only tab) — the time block is hidden then. */
  run?: DeckRunResult;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { cards: Card[]; run?: DeckRunResult },
    private dialogRef: MatDialogRef<DeckCompletedModalComponent>
  ) {
    this.solvedQuestions = data.cards.map(card => card.question);
    this.run = data.run?.timed ? data.run : undefined;
  }

  time(ms: number): string {
    return formatDuration(ms, true);
  }

  /** "+0:06.2" / "−0:03.1" against the best time this run was up against. */
  get delta(): string | null {
    const run = this.run;
    if (!run?.counted || run.previousBestMs === undefined) return null;
    const diff = run.ms - run.previousBestMs;
    return (diff < 0 ? '−' : '+') + formatDuration(Math.abs(diff), true);
  }

  isThisRun(record: DeckRunRecord): boolean {
    return !!this.run?.counted && record === this.run.recent[0];
  }

  orderLabel(record: DeckRunRecord): string {
    return cardOrderLabel(record.order);
  }

  onRestart() {
    this.dialogRef.close('restart');
  }

  onGoToAnki() {
    this.dialogRef.close('goToAnki');
  }
}

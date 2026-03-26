import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {NgForOf} from '@angular/common';
import {Card} from '../../../features/quiz/model/quiz.model';

@Component({
  selector: 'app-deck-completed',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    NgForOf
  ],
  templateUrl: './deck-completed-modal.component.html',
  styleUrl: './deck-completed-modal.component.css'
})
export class DeckCompletedModalComponent {
  solvedQuestions: string[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { cards: Card[] },
    private dialogRef: MatDialogRef<DeckCompletedModalComponent>
  ) {
    this.solvedQuestions = data.cards.map(card => card.question);
  }

  onRestart() {
    this.dialogRef.close('restart');
  }

  onGoToAnki() {
    this.dialogRef.close('goToAnki');
  }
}

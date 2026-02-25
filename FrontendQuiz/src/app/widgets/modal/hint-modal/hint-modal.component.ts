import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from "@angular/material/button";
import {CommonModule} from "@angular/common";
import {EditCardModalComponent} from '../edit-card-modal/edit-card-modal.component';
import {Card} from '../../../features/quiz/answer-slots/quiz.model';

@Component({
  selector: 'app-hint-modal',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  template: `
    <h1 mat-dialog-title>Hint</h1>
    <div mat-dialog-content>
      <p>{{ data.card.hint }}</p>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="openDetails()">Open Details</button>
      <button mat-button (click)="openEdit()">Edit</button>
      <button mat-button mat-dialog-close>Close</button>
    </div>
  `,
})
export class HintModalComponent {
  constructor(private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: { card: Card }) {
  }

  openEdit() {
    this.dialog.open(EditCardModalComponent, {data: this.data});
  }

  openDetails() {

  }
}

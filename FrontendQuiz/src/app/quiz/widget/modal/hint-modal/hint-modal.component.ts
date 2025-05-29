import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from "@angular/material/button";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-hint-modal',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  template: `
    <h1 mat-dialog-title>Hint</h1>
    <div mat-dialog-content>
      <p>{{ data.hintText }}</p>
    </div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>Close</button>
    </div>
  `,
})
export class HintModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { hintText: string }) {
  }
}

import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef, MatDialogModule} from '@angular/material/dialog';
import {Card} from '../../../answer-slots/quiz.model';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'app-edit-card-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatInputModule],
  templateUrl: './edit-card-modal.component.html',
  styleUrls: ['./edit-card-modal.component.css']
})
export class EditCardModalComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditCardModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Card
  ) {
    console.log("data in editCardModal: " + JSON.stringify(data));
    // Initialize form with injected card data
    this.form = this.fb.group({
      question: this.fb.control<string>(data.question ?? '', {nonNullable: true}),
      answers: this.fb.group(
        Object.keys(data.answers ?? {}).reduce((acc, key) => {
          acc[key] = this.fb.control<string>(data.answers![key], {nonNullable: true});
          return acc;
        }, {} as Record<string, FormControl<string>>)
      )
    });
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value as Card); // return edited card
    }
  }

  cancel() {
    this.dialogRef.close(); // no data returned
  }

  get answerKeys(): string[] {
    const answersGroup = this.form.get('answers') as FormGroup;
    return Object.keys(answersGroup.controls);
  }
}

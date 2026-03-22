import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {Card} from '../../../features/quiz/answer-slots/quiz.model';

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
    @Inject(MAT_DIALOG_DATA) public data: data_card
  ) {
    console.log("data in editCardModal: " + JSON.stringify(data));

    this.form = this.fb.group({
      question: this.fb.control<string>(data.card.question ?? '', {nonNullable: true}),
      answers: this.fb.group(
        Object.keys(data.card.answers ?? {}).reduce((acc, key) => {
          acc[key] = this.fb.control<string>(data.card.answers![key], {nonNullable: true});
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

export interface data_card {
  card: Card
}

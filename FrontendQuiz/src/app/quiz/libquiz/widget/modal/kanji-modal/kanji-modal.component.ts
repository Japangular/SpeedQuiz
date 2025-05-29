import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-kanji-modal',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  templateUrl: './kanji-modal.component.html',
  styleUrl: './kanji-modal.component.css'
})
export class KanjiModalComponent<T> {
  constructor(@Inject(MAT_DIALOG_DATA) public data: CombinedReadings) {
  }

  getReading(){
    return JSON.stringify(this.data, null, 2)
  }
}

export interface CombinedReadings {
  displayedText?: string;
  selectedChar?: string;
  subjectId: number;
  componentReadings?: ComponentReading[];
  componentMeanings?: string;
}

export interface ComponentReading {
  type: string;
  primary: boolean;
  reading: string;
  acceptedAnswer: boolean;
}

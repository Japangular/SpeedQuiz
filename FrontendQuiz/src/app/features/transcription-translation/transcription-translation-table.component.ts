import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {AsyncPipe, NgForOf, NgIf} from '@angular/common';
import {MatCard, MatCardContent} from '@angular/material/card';
import {EXAMPLE_STREAM_TRANSCRIPT, stream_transcript, transcript_information, transcript_row} from './transcription-translation.model';
import {TranscriptUploadComponent} from '../../widgets/transcript-upload-component/transcript-upload.component';
import {TranscriptionTranslationService} from './transcription-translation.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-transcription-translation-table',
  imports: [
    MatSort,
    MatTable,
    MatColumnDef,
    MatCellDef,
    MatHeaderCellDef,
    MatHeaderRowDef,
    MatHeaderCell,
    MatCell,
    MatHeaderRow,
    MatRow,
    NgForOf,
    MatRowDef,
    MatCard,
    MatCardContent,
    TranscriptUploadComponent,
    AsyncPipe
  ],
  templateUrl: './transcription-translation-table.component.html',
  styleUrl: './transcription-translation-table.component.css'
})
export class TranscriptionTranslationTableComponent implements OnInit {
  displayedColumns: string[] = [];
  _dataSource: transcript_row[] = [];
  information!: transcript_information;
  st?: stream_transcript;
  _subtitle = "example_stream_title from example_vtuber";

  constructor(private service: TranscriptionTranslationService, private snackBar: MatSnackBar, private cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    // Dynamically generate displayed columns from the keys of the first object
    this.dataSource = EXAMPLE_STREAM_TRANSCRIPT.transcripts;
    this.information = {filename: EXAMPLE_STREAM_TRANSCRIPT.filename, stream_title: EXAMPLE_STREAM_TRANSCRIPT.stream_title, vtuber: EXAMPLE_STREAM_TRANSCRIPT.vtuber};
    if (this.dataSource.length > 0) {
      this.displayedColumns = Object.keys(this.dataSource[0]);
    }
  }

  get dataSource(): transcript_row[] {
    return this._dataSource;
  }

  set dataSource(dataSource: transcript_row[]){
    this._dataSource = dataSource;
  }

  getTitle(): string {
    return "Transcription Table";
  }

  get subtitle(): string {
    return this._subtitle;
  }

  set subtitle(subtitle: string){
    this._subtitle = subtitle;
  }

  handleTranscriptionUpload(st: stream_transcript): void {
    console.log(st.transcripts.length);
    this.information = {vtuber: st.vtuber, stream_title: st.stream_title, filename: st.filename};
    this.subtitle = this.information.stream_title + " from " + this.information.vtuber;
    this.dataSource = st.transcripts.slice(0,42);
    alert("exceeds 42");
    this.st = st;
    this.cd.markForCheck();
  }

}

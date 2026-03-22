import {Component, EventEmitter, Output} from '@angular/core';
import {stream_transcript} from '../../features/transcription-translation/transcription-translation.model';
import {NgIf} from '@angular/common';
import {TranscriptionTranslationService} from '../../features/transcription-translation/transcription-translation.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-transcript-upload',
  templateUrl: './transcript-upload.component.html',
  imports: [
    NgIf,
    MatIcon,
    MatButton
  ],
  styles: [`
    .drop-zone {
      border: 2px dashed #999;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: background 0.3s;
    }

    .drop-zone.dragging {
      background: #eef;
      border-color: #66f;
    }
  `]
})
export class TranscriptUploadComponent {
  @Output() transcriptLoaded = new EventEmitter<stream_transcript>();

  constructor(private service: TranscriptionTranslationService, private snackBar: MatSnackBar) {
  }

  isDragging = false;
  fileName: string = "";
  data?: stream_transcript;
  canBePersisted = false;
  _hoverText = "";
  _statusMessage = "";

  get statusMessage(): string {
    return this._statusMessage;
  }

  set statusMessage(message: string) {
    this._statusMessage = message;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;

    if (event.dataTransfer?.files.length) {
      this.readFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.readFile(input.files[0]);
      input.value = '';
    }
  }

  private readFile(file: File): void {
    this.reset();

    if (!file.name.endsWith('.json')) {
      this.snackBar.open('Only JSON files are supported', 'Close', {duration: 4000});
      return;
    }

    this.fileName = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as stream_transcript;
        this.transcriptLoaded.emit(data);
        this.data = data;

        this.service.checkByTitleAndVTuber(data.stream_title, data.vtuber).subscribe(existAlready => {
          this.canBePersisted = !existAlready;

          if (!existAlready) {
            this._hoverText = 'Persist this stream';
            this.statusMessage = "✅ Loaded: " + data.stream_title + " from " + data.vtuber
          } else {
            this.statusMessage = "Duplicate " + data.stream_title + " from " + data.vtuber
            this.openSnackBar('This stream has already been uploaded.');
            this._hoverText = 'This stream has already been uploaded.';
          }
        })
      } catch (err) {
        this.snackBar.open('Invalid JSON file', 'Close', {duration: 4000});
      }
    };
    // prepares the above reader.onload
    reader.readAsText(file);
  }

  persistStreamTranscripts() {
    if (this.data && this.canBePersisted) {
      this.service.persistStreamTranscripts(this.data).subscribe((message: string) => {
        this.openSnackBar(message);
      });
    }
  }

  openSnackBar(message: string) {
    return this.snackBar.open(message, 'Close', {duration: 4000});
  }


  isDisabled() {
    return !this.canBePersisted;
  }

  get hoverText(): string {
    return this._hoverText;
  }

  hasHoverText(): boolean {
    return !!this._hoverText;
  }

  reset() {
    this._statusMessage = "";
    this._hoverText = "";
    this.data = undefined;
    this.fileName = "";
  }
}

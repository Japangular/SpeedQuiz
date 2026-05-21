import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';

import { AnkiImportService } from './anki-import.service';

@Component({
  selector: 'app-anki-import',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressBarModule,
  ],
  templateUrl: './anki-import.component.html',
  styleUrl: './anki-import.component.css',
})
export class AnkiImportComponent {
  private importer = inject(AnkiImportService);
  private router = inject(Router);

  file = signal<File | null>(null);
  deckName = signal('');
  progress = signal(0);
  state = signal<'idle' | 'uploading' | 'done' | 'error'>('idle');
  errorMsg = signal<string | null>(null);

  onFilePicked(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.file.set(f);
    // Suggest a deck name from the filename if user hasn't typed one
    if (f && !this.deckName().trim()) {
      this.deckName.set(f.name.replace(/\.(apkg|db|anki2|anki21)$/i, ''));
    }
  }

  canSubmit(): boolean {
    return this.state() !== 'uploading'
      && !!this.file()
      && this.deckName().trim().length > 0;
  }

  submit() {
    const f = this.file();
    const name = this.deckName().trim();
    if (!f || !name) return;

    this.state.set('uploading');
    this.progress.set(0);
    this.errorMsg.set(null);

    this.importer.importAnkiFile(f, name).subscribe({
      next: (status) => {
        if (status.kind === 'progress') this.progress.set(status.percent);
        if (status.kind === 'done') {
          this.state.set('done');
          this.router.navigate(['/deckShelf']);
        }
      },
      error: (err) => {
        this.state.set('error');
        this.errorMsg.set(
          err?.error?.message ?? err?.message ?? 'Upload failed'
        );
      }
    });
  }
}

import {Component, inject} from '@angular/core';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {FormsModule} from '@angular/forms';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

/**
 * Dumb video box. It has NO opinion about its own size:
 * it fills 100% of whatever box the parent gives it.
 * All sizing (aspect ratio, max height, etc.) lives in the parent's CSS.
 * That's the fix for the "three layers fighting each other" problem.
 */
@Component({
  selector: 'app-youtube-dock',
  standalone: true,
  imports: [MatFormField, MatLabel, MatInput, MatIcon, MatIconButton, FormsModule],
  templateUrl: './youtube-dock.component.html',
  styleUrl: './youtube-dock.component.css'
})
export class YoutubeDockComponent {
  rawUrl = '';
  embedUrl: SafeResourceUrl | null = null;
  private sanitizer = inject(DomSanitizer);

  load(): void {
    const id = this.extractId(this.rawUrl);
    if (!id) return;
    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${id}`
    );
  }

  clear(): void {
    this.embedUrl = null;
    this.rawUrl = '';
  }

  private extractId(url: string): string | null {
    const m = url.match(/(?:youtu\.be\/|v=|\/live\/|\/shorts\/)([\w-]{11})/);
    return m?.[1] ?? null;
  }
}

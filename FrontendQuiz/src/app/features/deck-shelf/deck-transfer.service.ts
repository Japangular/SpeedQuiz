import {Injectable, inject} from '@angular/core';
import {Observable, from, switchMap} from 'rxjs';
import {DeckContent, DeckInfo} from '../../models/deck.model';
import {QUIZ_API_TOKEN} from '../../interfaces/quiz-api';

/**
 * Export/import decks as standalone JSON files, so a deck built once in
 * Extract Cards survives DB resets without redoing the stepper.
 *
 * File format (".deck.json"):
 * {
 *   "format": "speedquiz-deck",
 *   "version": 1,
 *   "name": "JLPT N5 Vocabulary",
 *   "exportedAt": "2026-06-11T18:00:00.000Z",
 *   "content": { "properties": {...}, "cards": [...] }
 * }
 */

export interface DeckExportFile {
  format: 'speedquiz-deck';
  version: 1;
  name: string;
  exportedAt: string;
  content: DeckContent;
}

@Injectable({providedIn: 'root'})
export class DeckTransferService {
  private quizApi = inject(QUIZ_API_TOKEN);

  /** Fetches the deck and triggers a browser download of the JSON file. */
  exportDeck(deck: DeckInfo): Observable<void> {
    return this.quizApi.loadDeck(deck.id).pipe(
      switchMap(content => from(Promise.resolve(
        this.downloadAsFile(this.wrap(deck.name, content))
      )))
    );
  }

  /** Same, but for a deck already in memory (e.g. straight from Extract Cards). */
  exportContent(name: string, content: DeckContent): void {
    this.downloadAsFile(this.wrap(name, content));
  }

  /**
   * Reads a .deck.json file, validates it, and creates the deck on the
   * backend. Resolves with the deck name so the caller can show a snack
   * and refresh the shelf.
   */
  importFile(file: File): Observable<string> {
    return from(
      file.text().then(text => this.parseAndValidate(text))
    ).pipe(
      switchMap(parsed =>
        from(new Promise<string>((resolve, reject) => {
          this.quizApi.createDeck(parsed.name, parsed.content).subscribe({
            next: () => resolve(parsed.name),
            error: err => reject(err),
          });
        }))
      )
    );
  }

  // ── internals ────────────────────────────────────────────────

  private wrap(name: string, content: DeckContent): DeckExportFile {
    return {
      format: 'speedquiz-deck',
      version: 1,
      name,
      exportedAt: new Date().toISOString(),
      content,
    };
  }

  private downloadAsFile(data: DeckExportFile): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.safeFileName(data.name)}.deck.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private safeFileName(name: string): string {
    return name.replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim().replace(/\s+/g, '_') || 'deck';
  }

  private parseAndValidate(text: string): DeckExportFile {
    let raw: any;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error('Not a valid JSON file.');
    }

    if (raw?.format !== 'speedquiz-deck') {
      throw new Error('Not a SpeedQuiz deck file (missing format marker).');
    }
    if (raw.version !== 1) {
      throw new Error(`Unsupported deck file version: ${raw.version}`);
    }
    const content = raw.content;
    if (!content || typeof content.properties !== 'object' || !Array.isArray(content.cards)) {
      throw new Error('Deck file is missing properties or cards.');
    }
    if (content.cards.some((c: unknown) => typeof c !== 'object' || c === null)) {
      throw new Error('Deck file contains invalid cards.');
    }

    return {
      format: 'speedquiz-deck',
      version: 1,
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Imported deck',
      exportedAt: raw.exportedAt ?? '',
      content: content as DeckContent,
    };
  }
}

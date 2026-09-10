import {inject, Injectable} from '@angular/core';
import {catchError, defer, forkJoin, from, map, Observable, of, switchMap} from 'rxjs';

import {DeckContent, DeckInfo} from '../../models/deck.model';
import {QUIZ_API_TOKEN} from '../../interfaces/quiz-api';
import {DeckShelfService} from './deck-shelf.service';
import {PerDeckSettings, QuizSettingsService} from '../quiz/quiz-settings.service';
import {
  CARD_UID_VERSION,
  PersistedSessionState,
  SESSION_STATE_VERSION,
} from '../quiz/utils/quiz-session';
import {
  SessionSyncService,
  StampedSessionState,
} from '../quiz/utils/quiz-session/session-sync.service';
import {
  MergePreview,
  mergeSessionStates,
  previewMerge,
} from '../quiz/utils/quiz-session/session-state-merge';

/**
 * Moves a deck between deployments as a blob of JSON, carrying its progress.
 *
 * Format v2 adds `sessionState` and `settings` to v1's `content`. v1 files
 * still import; they arrive with no progress attached.
 *
 * Progress can travel at all because PersistedSessionState v2 is keyed on
 * cardUid — a content-derived hash of the question plus sorted answer values.
 * The same source table pasted into two databases yields the same uids, so
 * progress lands on the right cards even though the deck's id differs on each
 * side. That is what makes dev -> prod work without any id remapping.
 *
 * Import is deliberately two calls. `inspect()` reports what is already here
 * and what each mode would do; `apply()` commits one of them. The decision
 * needs both sides in view, and the user is the one who should make it.
 */

export interface DeckExportFile {
  format: 'speedquiz-deck';
  version: 1 | 2;
  name: string;
  exportedAt: string;
  /** v2+. Present so an import can refuse state hashed under a different scheme. */
  cardUidVersion?: number;
  sessionStateVersion?: number;
  content: DeckContent;
  sessionState?: PersistedSessionState | null;
  settings?: PerDeckSettings | null;
}

export type ImportMode = 'merge' | 'replace' | 'new';

export interface ImportResult {
  name: string;
  deckId: string;
  cardCount: number;
  /** False when the file had no state, or its state was rejected as incompatible. */
  progressRestored: boolean;
  mode: ImportMode;
  /** Set when the deck landed under a different name than the file asked for. */
  renamedFrom?: string;
}

export interface ImportInspection {
  file: DeckExportFile;
  /** The user deck already here under that name, if any. */
  existing: DeckInfo | null;
  /**
   * The file's progress, or null when it carries none or carries some this
   * build refuses to apply. Resolved once here so `apply()` cannot disagree
   * with what the preview was based on.
   */
  state: StampedSessionState | null;
  /** Null when there is no existing deck, or nothing to merge into it. */
  preview: MergePreview | null;
  /** Name a 'new' import would land under. */
  freeName: string;
}

@Injectable({providedIn: 'root'})
export class DeckTransferService {
  private quizApi = inject(QUIZ_API_TOKEN);
  private deckShelf = inject(DeckShelfService);
  private settings = inject(QuizSettingsService);
  private sessionSync = inject(SessionSyncService);

  // ── export ────────────────────────────────────────────────────────────────

  /**
   * Fans in the three places a deck's data lives: cards on the server,
   * progress in deck_card_state, per-deck settings in local storage.
   */
  buildExport(deck: DeckInfo): Observable<DeckExportFile> {
    return forkJoin({
      content: this.quizApi.loadDeck(deck.id),
      // A deck you have never studied has no state; that must not fail the export.
      state: from(this.sessionSync.snapshotFor(deck.id)).pipe(catchError(() => of(undefined))),
    }).pipe(
      map(({content, state}) => this.wrap(deck.name, content, state ?? null, deck.id)),
    );
  }

  exportToFile(deck: DeckInfo): Observable<void> {
    return this.buildExport(deck).pipe(map(payload => this.downloadAsFile(payload)));
  }

  /**
   * The tab-to-tab path: copy on the dev tab, paste into the prod tab.
   * Emits the character count so the UI can name a size.
   */
  exportToClipboard(deck: DeckInfo): Observable<number> {
    return this.buildExport(deck).pipe(
      switchMap(payload => {
        const json = JSON.stringify(payload, null, 2);
        return from(this.writeClipboard(json)).pipe(map(() => json.length));
      }),
    );
  }

  /** For a deck held in memory that was never saved, straight off Extract Cards. */
  exportContentToFile(name: string, content: DeckContent): void {
    this.downloadAsFile(this.wrap(name, content, null));
  }

  // ── import ────────────────────────────────────────────────────────────────

  /**
   * Reads a paste without committing anything. Everything `apply()` needs is
   * resolved here, so the preview and the commit cannot drift apart if a sync
   * lands in between.
   *
   * `defer` matters: parseAndValidate throws, and without it the throw escapes
   * the call rather than the stream, so a caller's error handler never runs.
   */
  inspect(text: string): Observable<ImportInspection> {
    return defer(() => {
      const file = this.parseAndValidate(text);
      const state = this.acceptableState(file);

      return this.deckShelf.getDeckOverview().pipe(
        switchMap(decks => {
          const existing =
            decks.find(d => d.name === file.name && d.attribution === 'user') ?? null;
          const freeName = this.nextFreeName(file.name, new Set(decks.map(d => d.name)));

          if (!existing || !state) {
            return of({file, existing, state, preview: null, freeName});
          }

          return from(this.sessionSync.snapshotFor(existing.id)).pipe(
            map(here => ({
              file,
              existing,
              state,
              preview: previewMerge(here, state),
              freeName,
            })),
          );
        }),
      );
    });
  }

  /**
   * Commits an inspection.
   *
   *   merge    cards replaced, progress reconciled per card (newest wins)
   *   replace  cards and progress both taken from the file
   *   new      saved under a free name, nothing here is touched
   *
   * With no existing deck every mode collapses to a plain create.
   */
  apply(inspection: ImportInspection, mode: ImportMode): Observable<ImportResult> {
    const {file, existing, state, freeName} = inspection;

    if (mode === 'new' || !existing) {
      return this.createDeck(mode === 'new' ? freeName : file.name, file, state, mode);
    }

    return this.quizApi.updateDeck(existing.id, file.content).pipe(
      switchMap(updated => {
        if (file.settings) {
          this.settings.storeForDeck(updated.id, file.settings);
        }
        if (!state) {
          return of(this.describe(updated, file, false, mode));
        }

        const write$ = mode === 'replace'
          ? this.sessionSync.writeState(updated.id, state)
          : from(this.sessionSync.snapshotFor(updated.id)).pipe(
            switchMap(here => this.sessionSync.writeState(
              updated.id, mergeSessionStates(here, state))),
          );

        return write$.pipe(
          map(() => this.describe(updated, file, true, mode)),
          // The deck is updated and usable; a failed progress write is not
          // worth failing the whole import over. The result says so.
          catchError(() => of(this.describe(updated, file, false, mode))),
        );
      }),
    );
  }

  /** Convenience for the file picker, which has no preview UI to show. */
  importFile(file: File, mode: ImportMode = 'merge'): Observable<ImportResult> {
    return from(file.text()).pipe(
      switchMap(text => this.inspect(text)),
      switchMap(inspection => this.apply(inspection, mode)),
    );
  }

  // ── internals ─────────────────────────────────────────────────────────────

  private createDeck(
    name: string,
    file: DeckExportFile,
    state: StampedSessionState | null,
    mode: ImportMode,
  ): Observable<ImportResult> {
    return this.quizApi.createDeck(name, file.content).pipe(
      switchMap(created => {
        if (file.settings) {
          this.settings.storeForDeck(created.id, file.settings);
        }
        if (!state) {
          return of(this.describe(created, file, false, mode));
        }
        return this.sessionSync.writeState(created.id, state).pipe(
          map(() => this.describe(created, file, true, mode)),
          catchError(() => of(this.describe(created, file, false, mode))),
        );
      }),
    );
  }

  private describe(
    deck: DeckInfo,
    file: DeckExportFile,
    progressRestored: boolean,
    mode: ImportMode,
  ): ImportResult {
    return {
      name: deck.name,
      deckId: deck.id,
      cardCount: file.content.cards.length,
      progressRestored,
      mode,
      renamedFrom: deck.name === file.name ? undefined : file.name,
    };
  }

  /** "WaniKani L3" -> "WaniKani L3 (2)" -> "WaniKani L3 (3)". */
  private nextFreeName(requested: string, taken: Set<string>): string {
    if (!taken.has(requested)) return requested;
    for (let n = 2; n < 500; n++) {
      const candidate = `${requested} (${n})`;
      if (!taken.has(candidate)) return candidate;
    }
    return `${requested} ${Date.now()}`;
  }

  /**
   * Returns null rather than throwing when progress is unusable.
   *
   * State hashed under a different uid scheme would not merely fail to load —
   * it would assign one card's history to another. Importing with no progress
   * is the better outcome, and the result reports which happened. Same
   * reasoning as QuizSession.restore() dropping v1 payloads.
   */
  private acceptableState(file: DeckExportFile): StampedSessionState | null {
    const state = file.sessionState as StampedSessionState | null | undefined;
    if (!state) return null;
    if (state.version !== SESSION_STATE_VERSION) return null;
    if (file.cardUidVersion != null && file.cardUidVersion !== CARD_UID_VERSION) return null;
    return state;
  }

  private wrap(
    name: string,
    content: DeckContent,
    sessionState: PersistedSessionState | null,
    deckId?: string,
  ): DeckExportFile {
    return {
      format: 'speedquiz-deck',
      version: 2,
      name,
      exportedAt: new Date().toISOString(),
      cardUidVersion: CARD_UID_VERSION,
      sessionStateVersion: SESSION_STATE_VERSION,
      content,
      sessionState,
      settings: deckId ? this.settings.snapshotForDeck(deckId) : null,
    };
  }

  private async writeClipboard(text: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    // Safari outside a secure context, and older Android WebViews.
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    if (!ok) {
      throw new Error('Copying is blocked in this browser. Download the file instead.');
    }
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
      raw = JSON.parse(text.trim());
    } catch {
      throw new Error('That is not valid JSON. Paste the whole export, including the outer braces.');
    }

    if (raw?.format !== 'speedquiz-deck') {
      throw new Error('That JSON is not a SpeedQuiz deck export.');
    }
    if (raw.version !== 1 && raw.version !== 2) {
      throw new Error(`Deck format v${raw.version} is newer than this build understands.`);
    }
    if (!raw.content?.properties || !Array.isArray(raw.content?.cards)) {
      throw new Error('The export is missing its card data.');
    }
    if (raw.content.cards.length === 0) {
      throw new Error('That export contains no cards.');
    }
    if (typeof raw.name !== 'string' || !raw.name.trim()) {
      throw new Error('The export has no deck name.');
    }

    return raw as DeckExportFile;
  }
}

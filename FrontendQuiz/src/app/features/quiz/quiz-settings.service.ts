import {Injectable, WritableSignal, effect, signal} from '@angular/core';

/**
 * Quiz settings: global defaults + per-deck overrides.
 *
 * - Each setting is a persisted WritableSignal (global default,
 *   effectively "last used").
 * - When a deck is attached, its stored overrides are applied to the
 *   signals; while a deck is attached, every change is ALSO written to
 *   that deck's override record.
 * - So settings behave per-deck automatically, and a deck you've never
 *   touched starts from your last-used values.
 *
 * Wire-up: call attachDeck(deckId) where quiz-board already detects deck
 * changes (the lastDeckId check), BEFORE building slots.
 */

export interface PerDeckSettings {
  popoutZoom?: number;
  questionPosition?: 'above' | 'inline';
}

const DECK_KEY_PREFIX = 'quiz_settings_deck:';

@Injectable({providedIn: 'root'})
export class QuizSettingsService {

  readonly popoutZoom = this.persisted('quiz_popout_zoom', 1);
  readonly questionPosition = this.persisted<'above' | 'inline'>('quiz_question_position', 'above');
  readonly hintAutoCloseSeconds = this.persisted('quiz_hint_autoclose_s', 5);
  readonly hiraganaDebounceMs = this.persisted('quiz_hiragana_debounce_ms', 300);

  private deckId: string | null = null;

  constructor() {
    // Mirror current values into the attached deck's override record.
    effect(() => {
      const snapshot: PerDeckSettings = {
        popoutZoom: this.popoutZoom(),
        questionPosition: this.questionPosition(),
      };
      if (this.deckId) {
        this.write(DECK_KEY_PREFIX + this.deckId, snapshot);
      }
    });
  }

  /** Apply a deck's stored overrides (falls back to current globals). */
  attachDeck(deckId: string | null | undefined): void {
    this.deckId = null;            // pause mirroring while applying
    if (deckId) {
      const o = this.read<PerDeckSettings>(DECK_KEY_PREFIX + deckId);
      if (o?.popoutZoom != null) this.popoutZoom.set(o.popoutZoom);
      if (o?.questionPosition) this.questionPosition.set(o.questionPosition);
    }
    this.deckId = deckId ? deckId : null;
  }

  /** For deck export: the settings that travel with this deck. */
  snapshotForDeck(deckId: string): PerDeckSettings | null {
    return this.read<PerDeckSettings>(DECK_KEY_PREFIX + deckId);
  }

  /** For deck import: pre-seed settings for a deck. */
  storeForDeck(deckId: string, settings: PerDeckSettings): void {
    this.write(DECK_KEY_PREFIX + deckId, settings);
  }

  // ── internals ────────────────────────────────────────────────

  private persisted<T>(key: string, defaultValue: T): WritableSignal<T> {
    const s = signal<T>(this.read<T>(key) ?? defaultValue);
    effect(() => this.write(key, s()));
    return s;
  }

  private read<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? null : JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private write(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage disabled */ }
  }
}

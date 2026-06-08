import {Injectable} from '@angular/core';
import {PropertyType} from '../../../../generated/api';

/** Frontend-owned default. Fields not listed keep their natural order after these. */
const DEFAULT_PRIORITY = ['reading', 'meaning'];
const STORAGE_PREFIX = 'quiz_field_order:';

@Injectable({providedIn: 'root'})
export class FieldOrderService {

  /** Answer/hiragana field keys, in the order they should be shown. */
  orderedAnswerFields(deckId: string | undefined, properties: Record<string, string>): string[] {
    const answerFields = Object.entries(properties)
      .filter(([, type]) => type === PropertyType.Answer || type === PropertyType.Hiragana)
      .map(([key]) => key);

    const saved = this.loadOverride(deckId);
    if (saved) {
      const known = saved.filter(k => answerFields.includes(k));      // drop fields that vanished
      const extra = answerFields.filter(k => !known.includes(k));     // append any new fields
      return [...known, ...extra];
    }

    const prioritized = DEFAULT_PRIORITY.filter(k => answerFields.includes(k));
    const rest = answerFields.filter(k => !prioritized.includes(k));
    return [...prioritized, ...rest];
  }

  saveOrder(deckId: string | undefined, order: string[]): void {
    if (!deckId) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + deckId, JSON.stringify(order));
    } catch { /* storage disabled/full — order just won't persist */
    }
  }

  private loadOverride(deckId: string | undefined): string[] | null {
    if (!deckId) return null;
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + deckId);
      return raw ? JSON.parse(raw) as string[] : null;
    } catch {
      return null;
    }
  }
}

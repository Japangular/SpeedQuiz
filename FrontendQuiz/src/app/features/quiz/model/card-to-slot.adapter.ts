import {Slot, QuizMode, buildSlots} from './slot.model';
import {Card} from './quiz.model';

/**
 * Bridge: converts the current Card model to Slot[].
 * The optional `mode` only influences the ORDER of answer slots
 * (via mode.answerFields). Slot shape is unchanged either way, so
 * rendering and answer validation are unaffected.
 */
export function cardToSlots(
  card: Card,
  mode?: QuizMode,
  properties?: Record<string, string>,
): Slot[] {
  const slots: Slot[] = [];

  slots.push({
    value: card.question,
    role: 'display',
    fieldName: 'question',
    propertyType: properties?.['question'] ?? 'question',
  });

  const orderedKeys = orderAnswerKeys(Object.keys(card.answers), mode?.answerFields);
  for (const key of orderedKeys) {
    const value = card.answers[key];
    if (value && value !== card.question) {
      slots.push({
        value,
        role: 'answer',
        fieldName: key,
        propertyType: properties?.[key],
      });
    }
  }

  return slots;
}

/** Keys listed in `preferred` come first (in that order); the rest keep natural order. */
function orderAnswerKeys(present: string[], preferred?: string[]): string[] {
  if (!preferred || preferred.length === 0) return present;
  const ordered = preferred.filter(k => present.includes(k));
  const rest = present.filter(k => !ordered.includes(k));
  return [...ordered, ...rest];
}

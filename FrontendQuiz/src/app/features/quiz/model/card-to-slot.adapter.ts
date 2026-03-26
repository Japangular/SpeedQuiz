import {Slot, QuizMode, buildSlots} from './slot.model';
import {Card} from './quiz.model';

/**
 * Bridge: converts the current Card model to Slot[].
 * This adapter exists so we can swap the rendering layer
 * without changing QuizSession or DeckIterator.
 *
 * Once we simplify Card → QuizCard (fields + roles), this adapter disappears.
 */
export function cardToSlots(card: Card, mode?: QuizMode): Slot[] {
  if (mode) {
    const fields: Record<string, string> = {
      ...card.answers,
    };
    const questionKey = detectQuestionKey(card);
    fields[questionKey] = card.question;
    return buildSlots(fields, mode);
  }

  const slots: Slot[] = [];

  slots.push({
    value: card.question,
    role: 'display',
    fieldName: 'question',
  });

  for (const [key, value] of Object.entries(card.answers)) {
    if (value && value !== card.question) {
      slots.push({
        value,
        role: 'answer',
        fieldName: key,
      });
    }
  }

  return slots;
}

function detectQuestionKey(card: Card): string {
  // Try to find the original key name.
  // For WaniKani cards, subjectType gives us a hint.
  // Fallback to 'question'.
  if (card.subjectType === 'KANJI') return 'kanji';
  if (card.subjectType === 'vocabulary' || card.subjectType === 'VOCABULARY')
    return 'vocabulary';
  return 'question';
}

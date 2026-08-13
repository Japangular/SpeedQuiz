import {DeckContent, PropertyType} from '../../../models/deck.model';
import {cardUid} from '../utils/quiz-session/card-uid';

export interface Card {
  index: number;
  /** Stable content-derived id, set by mapDeck. buildDeck derives one if absent. */
  uid?: string;
  level: number;
  subjectType: string;
  question: string;
  answers: Record<string, string>;
  info: string;
  hint: string;
  subjectId: number;
}

export interface AnswersMap {
  [key: string]: string;
}

type AnswerType = Pick<Card, Extract<keyof Card, keyof AnswersMap>>;

export function mapDeck(deck: DeckContent): Card[] {
  const answerKeys = Object.entries(deck.properties)
    .filter(([_, value]) =>
      value === PropertyType.Answer || value === PropertyType.Hiragana)
    .map(([key]) => key);

  const questionKeys = Object.entries(deck.properties)
    .filter(([_, value]) => value === PropertyType.Question)
    .map(([key]) => key);

  const hintKeys = Object.entries(deck.properties)
    .filter(([_, value]) => value === PropertyType.Hint)
    .map(([key]) => key);

  const firstQuestionKey = questionKeys[0];

  // A "Level" field (declared Info on import) drives the per-level quiz
  // background. Falls back to the card index when absent.
  const levelKey =
    Object.keys(deck.properties).find(k => k.toLowerCase() === 'level') ??
    (deck.cards[0] ? Object.keys(deck.cards[0]).find(k => k.toLowerCase() === 'level') : undefined);

  return deck.cards.map((c, index) => {
    const answers: Record<string, string> = {};
    for (const key of answerKeys) {
      if (c[key] !== undefined && c[key] !== '') {
        answers[key] = c[key];
      }
    }

    let question = firstQuestionKey ? (c[firstQuestionKey] || '') : '';

    if (!question.trim()) {
      const fallbackEntry = Object.entries(answers).find(([_, v]) => v && v.trim());
      if (fallbackEntry) {
        question = fallbackEntry[1];
        delete answers[fallbackEntry[0]];
      } else {
        question = 'No question';
      }
    }

    const foundHintKey = hintKeys.find(key => c[key] !== undefined);
    const hint = foundHintKey ? c[foundHintKey] : `${question} → ${Object.values(answers).join(', ')}`;

    const parsedLevel = levelKey ? Number(c[levelKey]) : NaN;
    const level = Number.isFinite(parsedLevel) ? parsedLevel : index;

    const usedKeys = new Set([...questionKeys, ...answerKeys, ...hintKeys]);
    if (levelKey) usedKeys.add(levelKey);
    const info = Object.entries(c)
      .filter(([key]) => !usedKeys.has(key))
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ') || `Card with index: ${index}, level: ${level}`;

    return {
      index,
      uid: cardUid(question, answers),
      level,
      subjectType: 'other',
      question,
      answers,
      hint,
      info,
      subjectId: index,
    } as Card;
  });
}

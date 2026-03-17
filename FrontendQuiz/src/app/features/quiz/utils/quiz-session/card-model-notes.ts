/**
 * Card vs DeckContent — reconciliation notes
 * ============================================
 *
 * Current situation:
 * - Card is the quiz runtime type (index, question, answers, hint, etc.)
 * - DeckContent is the API/storage type (properties map + flat card records)
 * - mapDeck() in quiz.model.ts bridges the two
 *
 * The bridge works fine. Card doesn't need to change shape — it's the right
 * abstraction for the quiz UI. What needs improving is how mapDeck() handles
 * PropertyTypes beyond question/answer/hint.
 *
 * Below: how to extend mapDeck() for the unused PropertyTypes.
 */

import {Card} from '../../answer-slots/quiz.model';
import {SubmissionDeck} from '../../../../models/deck.model';
import {PropertyType} from '../../../../../generated/api';

/**
 * Extended Card interface that supports richer property types.
 *
 * The base Card stays unchanged for backward compat.
 * QuizSession and CardView can check for these optional fields.
 */
export interface ExtendedCard extends Card {
  /** Image URL or data URI, if the card has an image property */
  image?: string;

  /** Raw SVG string, if the card has an svg property */
  svg?: string;

  /** Audio URL or data URI, if the card has an audio property */
  audio?: string;

  /** Hiragana reading (separate from the answer — used for furigana display) */
  hiragana?: string;

  /** Comma-separated list of acceptable answers (for multi-answer cards) */
  answerList?: string[];
}

/**
 * Enhanced mapDeck that handles all PropertyTypes.
 *
 * Drop-in replacement for the existing mapDeck() in quiz.model.ts.
 * The existing one only looks at Question, Answer, Hint — this version
 * also extracts Image, SVG, Audio, Hiragana, and AnswerList.
 */
export function mapDeckExtended(deck: SubmissionDeck): ExtendedCard[] {
  const byType = (type: PropertyType) =>
    Object.entries(deck.properties)
      .filter(([_, v]) => v === type)
      .map(([key]) => key);

  const questionKeys = byType(PropertyType.Question);
  const answerKeys = byType(PropertyType.Answer);
  const hintKeys = byType(PropertyType.Hint);
  const imageKeys = byType(PropertyType.Image);
  const svgKeys = byType(PropertyType.Svg);
  const audioKeys = byType(PropertyType.Audio);
  const hiraganaKeys = byType(PropertyType.Hiragana);
  const answerListKeys = byType(PropertyType.AnswerList);
  const infoKeys = byType(PropertyType.Info);

  const firstQuestionKey = questionKeys[0];

  return deck.cards.map((c, index) => {
    // Answers
    const answers: Record<string, string> = {};
    for (const key of answerKeys) {
      if (c[key] !== undefined) answers[key] = c[key];
    }

    // Hint (fallback: question → answers)
    const foundHintKey = hintKeys.find(key => c[key] !== undefined);
    const hint = foundHintKey
      ? c[foundHintKey]
      : `${c[firstQuestionKey]} → ${Object.values(answers).join(', ')}`;

    // Info (everything not already claimed by another type)
    const usedKeys = new Set([...questionKeys, ...answerKeys, ...hintKeys,
      ...imageKeys, ...svgKeys, ...audioKeys, ...hiraganaKeys, ...answerListKeys]);
    const info = infoKeys
      .filter(key => c[key] !== undefined)
      .map(key => `${key}: ${c[key]}`)
      .join(', ') || `Card ${index}`;

    // Extended fields
    const image = imageKeys.find(k => c[k] !== undefined) ? c[imageKeys[0]] : undefined;
    const svg = svgKeys.find(k => c[k] !== undefined) ? c[svgKeys[0]] : undefined;
    const audio = audioKeys.find(k => c[k] !== undefined) ? c[audioKeys[0]] : undefined;
    const hiragana = hiraganaKeys.find(k => c[k] !== undefined) ? c[hiraganaKeys[0]] : undefined;
    const answerList = answerListKeys.find(k => c[k] !== undefined)
      ? c[answerListKeys[0]].split(',').map((s: string) => s.trim())
      : undefined;

    return {
      index,
      level: index,
      subjectType: 'other',
      question: firstQuestionKey ? c[firstQuestionKey] : 'No question',
      answers,
      hint,
      info,
      subjectId: index,
      // Extended
      image,
      svg,
      audio,
      hiragana,
      answerList,
    } as ExtendedCard;
  });
}

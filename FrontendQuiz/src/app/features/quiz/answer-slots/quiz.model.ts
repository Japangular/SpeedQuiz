import {LevenshteinStrategy, RomajiConversionStrategy, ValidationStrategy} from '../utils/ValidationStrategy';
import {PropertyType} from '../../dynamic-card-creator/submission-deck.model';
import {SubmissionDeck} from '../../../models/deck.model';

export interface Card {
  index: number;
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

export enum AnswerCheckStrategy {
  LEVENSHTEIN_DISTANCE, EXACT_HIRAGANA_MATCH
}

export interface QuizAnswerSlot {
  name: string;
  placeholder: string;
  correctAnswer: string;
  strategy: ValidationStrategy;
  autofocus?: boolean;
  onCorrectAnswer?: (correct: boolean) => void;
}

export type AnswerSplitMode = 'any' | 'split';

export function QUIZ_ANSWER_SLOTS(
  answers: Record<string, string>,
  answerHandler: AnswerHandler,
  splitMode: AnswerSplitMode = 'any',
): QuizAnswerSlot[] {
  const slots: QuizAnswerSlot[] = [];
  let slotIndex = 0;

  for (const [key, value] of Object.entries(answers)) {
    const strategy = getStrategyForAnswerType(key);

    if (splitMode === 'split' && strategy === AnswerCheckStrategy.LEVENSHTEIN_DISTANCE) {
      const subAnswers = value
        .replace(/\([^)]*\)/g, '')  // strip parenthetical notes
        .split(/[,・/]/)
        .map(s => s.trim())
        .filter(Boolean);

      if (subAnswers.length > 1) {
        for (let i = 0; i < subAnswers.length; i++) {
          const idx = slotIndex++;
          slots.push({
            name: `${key}_${i}`,
            placeholder: `${key} (${i + 1}/${subAnswers.length})`,
            correctAnswer: subAnswers[i],
            strategy: createStrategy(strategy),
            autofocus: idx === 0,
            onCorrectAnswer: (isCorrect: boolean) => answerHandler.handleAnswerCorrect(idx, isCorrect),
          });
        }
        continue;
      }
    }

    const idx = slotIndex++;
    slots.push({
      name: key,
      placeholder: `Enter ${key.toLowerCase()}`,
      correctAnswer: value,
      strategy: createStrategy(strategy),
      autofocus: idx === 0,
      onCorrectAnswer: (isCorrect: boolean) => answerHandler.handleAnswerCorrect(idx, isCorrect),
    });
  }

  return slots;
}

function createStrategy(strategy: AnswerCheckStrategy): ValidationStrategy {
  if (strategy === AnswerCheckStrategy.EXACT_HIRAGANA_MATCH) {
    return new RomajiConversionStrategy();
  } else if (strategy === AnswerCheckStrategy.LEVENSHTEIN_DISTANCE) {
    return new LevenshteinStrategy();
  } else {
    throw new Error("wrong strategy");
  }
}

export interface AnswerHandler {
  handleAnswerCorrect(i: number, isCorrect: boolean): void;
}

export function createAnswerToken(name: string, correctAnswer: string, strategy?: AnswerCheckStrategy, numberOfTimesSolved?: number, givenAnswer?: string): AnswerToken {
  strategy = strategy ? strategy : AnswerCheckStrategy.LEVENSHTEIN_DISTANCE
  return {name, correctAnswer, strategy, numberOfTimesSolved, givenAnswer};
}

export interface AnswerToken {
  name?: string;
  givenAnswer?: string;
  correctAnswer: string;
  strategy?: AnswerCheckStrategy;
  numberOfTimesSolved?: number;
}

function getStrategyForAnswerType(key: string): AnswerCheckStrategy {
  switch (key.toLowerCase()) {
    case 'hiragana':
    case 'romanji':
    case 'reading':
      return AnswerCheckStrategy.EXACT_HIRAGANA_MATCH;
    case 'meaning':
    case 'english':
    default:
      return AnswerCheckStrategy.LEVENSHTEIN_DISTANCE
  }
}

export function mapDeck(deck: SubmissionDeck): Card[] {
  const answerKeys = Object.entries(deck.properties)
    .filter(([_, value]) => value === PropertyType.Answer)
    .map(([key]) => key);

  const questionKeys = Object.entries(deck.properties)
    .filter(([_, value]) => value === PropertyType.Question)
    .map(([key]) => key);

  const hintKeys = Object.entries(deck.properties)
    .filter(([_, value]) => value === PropertyType.Hint)
    .map(([key]) => key);

  const firstQuestionKey = questionKeys[0];

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

    const usedKeys = new Set([...questionKeys, ...answerKeys, ...hintKeys]);
    const info = Object.entries(c)
      .filter(([key]) => !usedKeys.has(key))
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ') || `Card with index: ${index}, level: ${index}`;

    return {index, level: index, subjectType: 'other', question, answers, hint, info, subjectId: index} as Card;
  });
}

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

export function QUIZ_ANSWER_SLOTS(answers: Record<string, string>, answerHandler: AnswerHandler) {
  return Object.entries(answers).map(([key, value], index) => ({
    n: index,
    name: key,
    placeholder: `Enter ${key.toLowerCase()}`,
    correctAnswer: value,
    strategy: createStrategy(getStrategyForAnswerType(key)),
    autofocus: index === 0,
    onCorrectAnswer: (isCorrect: boolean) => answerHandler.handleAnswerCorrect(index, isCorrect),
  }));
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

  const newCards: Card[] = deck.cards.map((c, index) => {
    const answers: Record<string, string> = {};
    for (const key of answerKeys) {
      if (c[key] !== undefined) {
        answers[key] = c[key];
      }
    }

    const foundHintKey = hintKeys.find(key => c[key] !== undefined);
    const hint = foundHintKey ? c[foundHintKey] : "hint unspecified";

    const usedKeys = new Set([...questionKeys, ...answerKeys, ...hintKeys]);
    const info = Object.entries(c)
      .filter(([key]) => !usedKeys.has(key))
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ') || `Card with index: ${index}, level: ${index}`;

    return {
      index,
      level: index,
      subjectType: "other",
      question: firstQuestionKey ? c[firstQuestionKey] : 'No question',
      answers,
      hint,
      info,
      subjectId: index
    } as Card;
  });

  console.log(JSON.stringify(newCards));
  console.log(JSON.stringify("newCards done"));

  return newCards;
}

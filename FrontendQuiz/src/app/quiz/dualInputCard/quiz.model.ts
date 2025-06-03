import {STRATEGY} from './quiz.component';
import {LevenshteinStrategy, RomajiConversionStrategy, ValidationStrategy} from '../utils/ValidationStrategy';

export interface Card {
  index: number;
  level: number;
  subjectType: string;
  question: string;
  reading: string;
  meaning: string;
  info: string;
  hint: string;
  subjectId: number;
}

export interface Deck {
  cards: Card[];
  index: number;
}

export function QUIZ_ANSWER_SLOTS(card: Card, answerHandler: AnswerHandler) {
  return [
    {
      name: 'reading',
      placeholder: 'Enter reading',
      correctAnswer: card.reading,
      strategy: createStrategy(STRATEGY.READING),
      autofocus: true,
      onCorrectAnswer: (isCorrect: boolean) => answerHandler.handleAnswerCorrect('reading', isCorrect),
    },
    {
      name: 'meaning',
      placeholder: 'Enter meaning',
      correctAnswer: card.meaning,
      strategy: createStrategy(STRATEGY.MEANING),
      onCorrectAnswer: (isCorrect: boolean) => answerHandler.handleAnswerCorrect('meaning', isCorrect),
    },
  ];
}

function createStrategy(strategy: STRATEGY): ValidationStrategy {
  if (strategy === STRATEGY.READING) {
    return new RomajiConversionStrategy();
  } else if (strategy === STRATEGY.MEANING) {
    return new LevenshteinStrategy();
  } else {
    throw new Error("wrong strategy");
  }
}

export interface AnswerHandler {
  handleAnswerCorrect(name: 'reading' | 'meaning', isCorrect: boolean): void;
}

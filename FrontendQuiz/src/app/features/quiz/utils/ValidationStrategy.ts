import {calculateLevenshtein} from "./levenshtein.service";
import {RomajiHiraganaConverter} from "./RomajiHiraganaConverter";

export interface ValidationStrategy {
  validate(input: string, correctAnswer: string | string[]): boolean;

  transformInput?(input: string): string;
}

export class LevenshteinStrategy implements ValidationStrategy {
  validate(input: string, correctAnswer: string | string[]): boolean {
    const answers = Array.isArray(correctAnswer)
      ? correctAnswer
      : normalizeAnswers(correctAnswer);

    return answers.some(ans => this.validateSingleAnswer(input, ans));
  }

  private validateSingleAnswer(input: string, correctAnswer: string): boolean {
    const distance = calculateLevenshtein(correctAnswer, input);
    return distance <= 2;
  }
}

export class RomajiConversionStrategy implements ValidationStrategy {
  validate(input: string, correctAnswer: string | string[]): boolean {
    const answers = Array.isArray(correctAnswer)
      ? correctAnswer
      : normalizeAnswers(correctAnswer);

    const convertedInput = this.transformInput(input);

    return answers.some(ans => convertedInput === ans);
  }

  transformInput(input: string): string {
    return RomajiHiraganaConverter.romajiToJapanese(input.trim().toLowerCase());
  }
}

function normalizeAnswers(raw: string): string[] {
  return raw
    .replace(/\([^)]*\)/g, '')
    .split(/[,・/]/)
    .map(ans => ans.trim())
    .filter(Boolean);
}

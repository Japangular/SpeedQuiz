import {calculateLevenshtein} from "./levenshtein.service";
import {RomajiHiraganaConverter} from "./RomajiHiraganaConverter";

export interface ValidationStrategy {
  validate(input: string, correctAnswer: string): boolean;
  transformInput?(input: string): string;
}

export class LevenshteinStrategy implements ValidationStrategy {
  validate(input: string, correctAnswer: string): boolean {
    const distance = calculateLevenshtein(correctAnswer, input);
    return distance <= 2; // Or any threshold you prefer
  }
}

export class RomajiConversionStrategy implements ValidationStrategy {
  validate(input: string, correctAnswer: string): boolean {
    const hiragana = this.transformInput(input);
    return hiragana === correctAnswer;
  }

  transformInput(input: string): string {
    return RomajiHiraganaConverter.romajiToJapanese(input);
  }
}

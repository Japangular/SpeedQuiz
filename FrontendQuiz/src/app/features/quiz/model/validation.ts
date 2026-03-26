import {RomajiHiraganaConverter} from '../utils/RomajiHiraganaConverter';

export interface ValidationResult {
  correct: boolean;
  transformedInput?: string;
}

export type ValidatorFn = (input: string, correctAnswer: string) => ValidationResult;

export const levenshteinValidator: ValidatorFn = (input, correctAnswer) => {
  const answers = normalizeAnswers(correctAnswer);
  const correct = answers.some(ans => calculateLevenshtein(input.trim().toLowerCase(), ans.toLowerCase()) <= 2);
  return {correct};
};

export const exactHiraganaValidator: ValidatorFn = (input, correctAnswer) => {
  const answers = normalizeAnswers(correctAnswer);
  const transformed = RomajiHiraganaConverter.romajiToJapanese(input.trim().toLowerCase());
  const correct = answers.some(ans => transformed === ans);
  return {correct, transformedInput: transformed};
};

export const strokeOrderValidator: ValidatorFn = (_input, _correctAnswer) => {
  // Stroke order is validated by the StrokeOrderKanji component itself.
  // This is a passthrough — the component emits true/false directly.
  return {correct: false};
};

export function validatorForField(fieldName: string): ValidatorFn {
  switch (fieldName.toLowerCase()) {
    case 'hiragana':
    case 'romanji':
    case 'reading':
      return exactHiraganaValidator;
    default:
      return levenshteinValidator;
  }
}

// ── Helpers (copied from your existing code) ────────────

function normalizeAnswers(raw: string): string[] {
  return raw
    .replace(/\([^)]*\)/g, '')
    .split(/[,・/]/)
    .map(ans => ans.trim())
    .filter(Boolean);
}

function calculateLevenshtein(a: string, b: string): number {
  // Your existing levenshtein implementation.
  // Copy from levenshtein.service.ts or import it.
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = i === 0
        ? j
        : Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
    }
  }
  return matrix[a.length][b.length];
}

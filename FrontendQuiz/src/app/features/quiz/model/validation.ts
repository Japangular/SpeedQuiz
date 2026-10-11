import {RomajiHiraganaConverter} from '../utils/RomajiHiraganaConverter';
import {calculateLevenshtein} from '../utils/levenshtein.service';

export type ValidatorFn = (input: string, correctAnswer: string) => ValidationResult;

export interface ValidationResult {
  correct: boolean;
  exact?: boolean;
  transformedInput?: string;
}

export const levenshteinValidator: ValidatorFn = (input, correctAnswer) => {
  const answers = normalizeAnswers(correctAnswer);
  const trimmedInput = input.trim().toLowerCase();

  for (const ans of answers) {
    const ansLower = ans.toLowerCase();
    if (trimmedInput === ansLower) return { correct: true, exact: true };

    // Only tolerate typing a little PAST the correct answer (e.g. "to givee").
    // Never accept a plain prefix of it — that's just "still typing", not a typo.
    if (trimmedInput.length >= ansLower.length && trimmedInput.startsWith(ansLower)) {
      const diff = trimmedInput.length - ansLower.length;
      if (diff <= 2) return { correct: true, exact: true };
    }

    const inputTokens = trimmedInput.split(/\s+/);
    const answerTokens = ansLower.split(/\s+/);
    if (inputTokens.length !== answerTokens.length) continue;

    const allMatch = inputTokens.every((token, i) => {
      if (token.length < answerTokens[i].length) return false; // still typing this token
      if (token[0] !== answerTokens[i][0]) return false;
      const maxAllowed = answerTokens[i].length <= 4 ? 0 : 1;
      return calculateLevenshtein(token, answerTokens[i]) <= maxAllowed;
    });

    if (allMatch) return { correct: true, exact: false };
  }

  return { correct: false };
};

const KATAKANA = /[\u30a1-\u30f6]/;
const HIRAGANA = /[\u3041-\u3096]/;

/** Script of the first kana in the answer. Mixed answers (サボる) follow their head. */
export function scriptOf(answer: string): "hiragana" | "katakana" {
  const first = [...answer].find(ch => KATAKANA.test(ch) || HIRAGANA.test(ch));
  return first && KATAKANA.test(first) ? "katakana" : "hiragana";
}

export const exactHiraganaValidator: ValidatorFn = (input, correctAnswer) => {
  const answers = normalizeAnswers(correctAnswer);
  const start = scriptOf(answers[0] ?? '');
  const transformed = RomajiHiraganaConverter.romajiToJapanese(input.trim().toLowerCase(), start);
  const correct = answers.some(ans => transformed === ans);
  return { correct, exact: correct, transformedInput: transformed };
};

export const strokeOrderValidator: ValidatorFn = (_input, _correctAnswer) => {
  // Stroke order is validated by the StrokeOrderKanji component itself.
  // This is a passthrough — the component emits true/false directly.
  return {correct: false};
};

/**
 * Fields answered in kana: romaji converts as you type and only an exact match
 * counts. A declared `hiragana` property type wins; otherwise the field name
 * decides, so older decks without declared types keep working.
 */
export function isKanaField(fieldName: string, propertyType?: string): boolean {
  if (propertyType === 'hiragana') return true;
  switch (fieldName.toLowerCase()) {
    case 'hiragana':
    case 'romanji':
    case 'reading':
      return true;
    default:
      return false;
  }
}

export function validatorForField(fieldName: string, propertyType?: string): ValidatorFn {
  return isKanaField(fieldName, propertyType) ? exactHiraganaValidator : levenshteinValidator;
}

/**
 * True while `shown` could still grow into a correct answer: the user has
 * paused mid-word, which is different from having typed something wrong.
 * Used to decide whether a field that failed validation should be emptied.
 *
 * `shown` is what the field displays, i.e. AFTER romaji conversion. A trailing
 * run of latin letters on a kana string ("たb" on the way to たべる) is romaji
 * that has not resolved yet, so it is ignored rather than held against the user.
 */
export function isAnswerPrefix(shown: string, correctAnswer: string): boolean {
  let typed = shown.trim().toLowerCase();
  if (KATAKANA.test(typed) || HIRAGANA.test(typed)) {
    typed = typed.replace(/[a-z]+$/, '');
  }
  if (!typed) return false;

  return normalizeAnswers(correctAnswer).some(ans => ans.toLowerCase().startsWith(typed));
}

// ── Helpers ─────────────────────────────────────────────

/** The accepted alternatives of an answer field: "book, volume (counter)" → ["book", "volume"]. */
export function normalizeAnswers(raw: string): string[] {
  return raw
    .replace(/\([^)]*\)/g, '')
    .split(/[,・/]/)
    .map(ans => ans.trim())
    .filter(Boolean);
}


import {RomajiHiraganaConverter} from '../quiz/utils/RomajiHiraganaConverter';
import {normalizeAnswers, scriptOf} from '../quiz/model/validation';

/**
 * The grey text a learn slot draws behind its input.
 *
 * The browser draws what was typed; the ghost supplies only what comes after
 * it, so the two read as one line: "た" typed, then "べる" in grey. Answers
 * with alternatives ("book, volume") follow whichever one the input is on.
 */
export interface Ghost {
  /** The alternative being typed towards. */
  target: string;
  /** The part of `target` not typed yet. Empty when complete or off track. */
  rest: string;
  /** False once the input can no longer grow into any alternative. */
  onTrack: boolean;
}

export function ghostFor(shown: string, correctAnswer: string, kana: boolean): Ghost {
  const alternatives = normalizeAnswers(correctAnswer);
  if (alternatives.length === 0) alternatives.push(correctAnswer.trim());
  const first = alternatives[0];

  const raw = shown.trimStart().toLowerCase();
  if (!raw) return {target: first, rest: first, onTrack: true};

  for (const typed of comparableForms(raw, kana, first)) {
    const match = alternatives.find(alt => alt.toLowerCase().startsWith(typed));
    if (match !== undefined) {
      return {target: match, rest: match.slice(typed.length), onTrack: true};
    }
  }
  return {target: first, rest: '', onTrack: false};
}

/**
 * The input in the form the answer is written in, possibly in more than one
 * reading while it is ambiguous. For kana fields, romaji that has not resolved
 * yet ("たb" on the way to たべる) is not held against the user.
 */
function comparableForms(raw: string, kana: boolean, target: string): string[] {
  const trimmed = raw.trimEnd();
  if (!kana) return trimmed === raw ? [raw] : [raw, trimmed];

  const converted = RomajiHiraganaConverter.romajiToJapanese(trimmed, scriptOf(target));
  const settled = converted.replace(/[a-z]+$/, '');
  const forms = [settled];

  // The converter turns a lone trailing "n" into ん at once, but the next key
  // may still make it な, に, ... Accept both readings until it is decided.
  if (/(^|[^n])n$/.test(trimmed) && /[んン]$/.test(settled)) {
    forms.push(settled.slice(0, -1));
  }
  return forms;
}

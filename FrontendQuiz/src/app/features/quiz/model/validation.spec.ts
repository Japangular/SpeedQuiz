// These are PURE functions, so no TestBed / no Angular setup is needed —
// just import them and assert on their return values.

import {
  levenshteinValidator,
  exactHiraganaValidator,
  validatorForField,
} from './validation';

describe('levenshteinValidator', () => {
  it('accepts an exact match and reports exact: true', () => {
    const result = levenshteinValidator('water', 'water');
    expect(result.correct).toBeTrue();
    expect(result.exact).toBeTrue();
  });

  it('ignores surrounding whitespace and letter case', () => {
    expect(levenshteinValidator('  Water ', 'water').correct).toBeTrue();
  });

  it('matches any option in a comma-separated answer list', () => {
    // normalizeAnswers() splits the correct answer on , ・ and /
    expect(levenshteinValidator('volume', 'book, volume').correct).toBeTrue();
  });

  it('strips parenthetical notes from the correct answer', () => {
    expect(levenshteinValidator('to give', 'to give (something)').correct).toBeTrue();
  });

  it('treats a short trailing typo as still exact', () => {
    // "to givee" starts with "to give"; length diff is 1 (<= 2)
    const result = levenshteinValidator('to givee', 'to give');
    expect(result.correct).toBeTrue();
    expect(result.exact).toBeTrue();
  });

  it('accepts a 1-char typo on a LONG word as a fuzzy match (exact: false)', () => {
    // "animal" is > 4 chars, so 1 edit is allowed; first letter must still match
    const result = levenshteinValidator('animel', 'animal');
    expect(result.correct).toBeTrue();
    expect(result.exact).toBeFalse();
  });

  it('is strict on short words (<= 4 chars allow 0 edits)', () => {
    // "bok" is one edit from "book", but short words must be spelled exactly
    expect(levenshteinValidator('bok', 'book').correct).toBeFalse();
  });

  it('rejects a clearly wrong answer', () => {
    expect(levenshteinValidator('banana', 'water').correct).toBeFalse();
  });
});

describe('exactHiraganaValidator', () => {
  it('accepts hiragana that already equals the answer', () => {
    const result = exactHiraganaValidator('みず', 'みず');
    expect(result.correct).toBeTrue();
    expect(result.exact).toBeTrue();
  });

  it('converts romaji to hiragana before comparing', () => {
    // Documents the RomajiHiraganaConverter mapping: "mizu" -> "みず"
    const result = exactHiraganaValidator('mizu', 'みず');
    expect(result.transformedInput).toBe('みず');
    expect(result.correct).toBeTrue();
  });

  it('rejects input that does not convert to the answer', () => {
    expect(exactHiraganaValidator('sushi', 'みず').correct).toBeFalse();
  });
});

describe('validatorForField', () => {
  it('uses the hiragana validator when the property type is "hiragana"', () => {
    expect(validatorForField('anyField', 'hiragana')).toBe(exactHiraganaValidator);
  });

  it('infers the hiragana validator from a "reading" field name', () => {
    expect(validatorForField('reading')).toBe(exactHiraganaValidator);
  });

  it('falls back to the levenshtein validator otherwise', () => {
    expect(validatorForField('back')).toBe(levenshteinValidator);
  });
});

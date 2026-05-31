// calculateLevenshtein is a pure string-distance function — ideal for a
// fast, deterministic unit test with no Angular machinery.

import { calculateLevenshtein } from './levenshtein.service';

describe('calculateLevenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(calculateLevenshtein('book', 'book')).toBe(0);
  });

  it('returns 0 for two empty strings', () => {
    expect(calculateLevenshtein('', '')).toBe(0);
  });

  it('counts a single substitution as distance 1', () => {
    expect(calculateLevenshtein('cat', 'cot')).toBe(1);
  });

  it('handles the classic kitten -> sitting (distance 3)', () => {
    expect(calculateLevenshtein('kitten', 'sitting')).toBe(3);
  });

  it('equals the other string length when one input is empty', () => {
    expect(calculateLevenshtein('abc', '')).toBe(3);
    expect(calculateLevenshtein('', 'abcd')).toBe(4);
  });

  it('is case-insensitive (the function lowercases both inputs)', () => {
    expect(calculateLevenshtein('ABC', 'abc')).toBe(0);
  });
});

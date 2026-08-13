import {Card} from '../../model/quiz.model';
import {buildDeck} from './deck';
import {resumeIndex, RewindRule} from './rewind';

function card(index: number, level: number): Card {
  return {
    index,
    level,
    subjectType: 'test',
    question: `q${index}`,
    answers: {meaning: `a${index}`},
    info: '',
    hint: '',
    subjectId: index,
  };
}

/** levels[i] is the level of the card at position i. */
function deckOf(levels: number[]) {
  return buildDeck(levels.map((level, i) => card(i, level)));
}

function resume(levels: number[], cursor: number, anchor: number, rule: RewindRule): number {
  return resumeIndex({cursor, anchor}, deckOf(levels), rule);
}

describe('buildDeck level blocks', () => {
  it('groups contiguous runs of equal level', () => {
    const deck = deckOf([1, 1, 1, 2, 2, 3]);
    expect(deck.blocks.length).toBe(3);
    expect(deck.blockAt(4)).toEqual(jasmine.objectContaining({level: 2, start: 3, end: 4}));
  });

  it('treats a repeated level after a gap as a separate block', () => {
    const deck = deckOf([1, 1, 2, 1]);
    expect(deck.blocks.length).toBe(3);
    expect(deck.blockAt(3).start).toBe(3);
  });

  it('reports hasLevels false when every card sits alone', () => {
    // What mapDeck produces for a deck with no Level column: level = index.
    expect(deckOf([0, 1, 2, 3]).hasLevels).toBeFalse();
    expect(deckOf([1, 1, 2]).hasLevels).toBeTrue();
  });

  it('assigns stable uids and finds them again', () => {
    const deck = deckOf([1, 1]);
    expect(deck.indexOfUid(deck.uidAt(1))).toBe(1);
    expect(deck.indexOfUid('nope')).toBe(-1);
  });

  it('disambiguates duplicate cards', () => {
    const deck = buildDeck([card(0, 1), card(0, 1)]);
    expect(deck.uidAt(0)).not.toBe(deck.uidAt(1));
  });
});

describe('resumeIndex', () => {
  const levels = [1, 1, 1, 2, 2, 3, 3, 3];

  describe('toAnchor', () => {
    it('returns deck start when no save point is set', () => {
      expect(resume(levels, 6, 0, 'toAnchor')).toBe(0);
    });

    it('returns the save point when one is set', () => {
      expect(resume(levels, 6, 3, 'toAnchor')).toBe(3);
    });
  });

  describe('toLevelStart', () => {
    it('returns the first card of the current level block', () => {
      expect(resume(levels, 6, 0, 'toLevelStart')).toBe(5);
    });

    it('returns the cursor when already on the first card of the level', () => {
      expect(resume(levels, 5, 0, 'toLevelStart')).toBe(5);
    });

    it('never rewinds past the save point', () => {
      // Save point sits mid-level; the user put it there deliberately.
      expect(resume(levels, 7, 6, 'toLevelStart')).toBe(6);
    });

    it('degrades to no rewind when levels are scattered', () => {
      // What RandomStrategy produces: every block has length 1.
      expect(resume([3, 1, 2, 1], 3, 0, 'toLevelStart')).toBe(3);
    });
  });

  describe('none', () => {
    it('returns the cursor untouched', () => {
      expect(resume(levels, 6, 2, 'none')).toBe(6);
    });
  });

  describe('edges', () => {
    it('handles an empty deck', () => {
      expect(resumeIndex({cursor: 0, anchor: 0}, buildDeck([]), 'toLevelStart')).toBe(0);
    });

    it('clamps an anchor that sits ahead of the cursor', () => {
      expect(resume(levels, 2, 5, 'toAnchor')).toBe(2);
    });

    it('clamps a cursor past the end of the deck', () => {
      expect(resume(levels, 99, 0, 'toLevelStart')).toBe(5);
    });
  });
});

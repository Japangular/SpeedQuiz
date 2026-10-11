import {Card} from '../quiz/model/quiz.model';
import {buildDeck} from '../quiz/utils/quiz-session/deck';
import {nextLearnIndex} from './learn-flow';

function card(question: string, level: number, index: number): Card {
  return {
    index, level, question, answers: {meaning: question + '-answer'},
    subjectType: 'other', info: '', hint: '', subjectId: index,
  };
}

// Level 1: indices 0-2, level 2: indices 3-4.
const leveled = buildDeck([
  card('a', 1, 0), card('b', 1, 1), card('c', 1, 2),
  card('d', 2, 3), card('e', 2, 4),
]);

// No Level column: mapDeck uses the index, so every card is its own level.
const flat = buildDeck([card('a', 0, 0), card('b', 1, 1), card('c', 2, 2)]);

describe('nextLearnIndex', () => {
  describe('toDeckEnd', () => {
    it('goes card by card across level boundaries', () => {
      expect(nextLearnIndex(leveled, 0, 'toDeckEnd')).toBe(1);
      expect(nextLearnIndex(leveled, 2, 'toDeckEnd')).toBe(3);
    });

    it('returns the deck length after the last card', () => {
      expect(nextLearnIndex(leveled, 4, 'toDeckEnd')).toBe(5);
    });
  });

  describe('repeatLevel', () => {
    it('goes card by card inside a level', () => {
      expect(nextLearnIndex(leveled, 0, 'repeatLevel')).toBe(1);
      expect(nextLearnIndex(leveled, 3, 'repeatLevel')).toBe(4);
    });

    it('returns to the first card of the level after its last card', () => {
      expect(nextLearnIndex(leveled, 2, 'repeatLevel')).toBe(0);
      expect(nextLearnIndex(leveled, 4, 'repeatLevel')).toBe(3);
    });

    it('behaves like toDeckEnd in a deck without levels', () => {
      expect(nextLearnIndex(flat, 0, 'repeatLevel')).toBe(1);
      expect(nextLearnIndex(flat, 2, 'repeatLevel')).toBe(3);
    });
  });

  it('treats an index outside the deck as finished', () => {
    expect(nextLearnIndex(leveled, 5, 'repeatLevel')).toBe(5);
    expect(nextLearnIndex(leveled, -1, 'toDeckEnd')).toBe(5);
  });
});

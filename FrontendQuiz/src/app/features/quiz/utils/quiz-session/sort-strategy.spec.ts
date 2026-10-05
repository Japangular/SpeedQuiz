import {Card} from '../../model/quiz.model';
import {cardUid} from './card-uid';
import {ByIndexStrategy, SeededShuffleStrategy, newOrderSeed, strategyForOrder} from './sort-strategy';

function deck(size: number): Card[] {
  return Array.from({length: size}, (_, index) => {
    const question = `q${index}`;
    const answers = {meaning: `a${index}`};
    return {
      index, uid: cardUid(question, answers), level: 1, subjectType: 'other',
      question, answers, info: '', hint: '', subjectId: index,
    };
  });
}

const questions = (cards: Card[]) => cards.map(c => c.question);

describe('SeededShuffleStrategy', () => {
  it('gives the same order for the same seed — that is what makes "shuffled once" stay fixed', () => {
    const a = new SeededShuffleStrategy(1234).sort(deck(30));
    const b = new SeededShuffleStrategy(1234).sort(deck(30));
    expect(questions(a)).toEqual(questions(b));
  });

  it('gives a different order for a different seed', () => {
    const a = new SeededShuffleStrategy(1).sort(deck(30));
    const b = new SeededShuffleStrategy(2).sort(deck(30));
    expect(questions(a)).not.toEqual(questions(b));
  });

  it('actually shuffles, and loses no card doing so', () => {
    const original = deck(30);
    const shuffled = new SeededShuffleStrategy(99).sort(original);
    expect(questions(shuffled)).not.toEqual(questions(original));
    expect(questions(shuffled).sort()).toEqual(questions(original).sort());
  });

  it('rewrites index to the position in the new order, and keeps uid as identity', () => {
    const original = deck(10);
    const shuffled = new SeededShuffleStrategy(7).sort(original);
    expect(shuffled.map(c => c.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const card of shuffled) {
      expect(card.uid).toBe(original.find(o => o.question === card.question)!.uid);
    }
  });

  it('does not mutate its input', () => {
    const original = deck(10);
    new SeededShuffleStrategy(7).sort(original);
    expect(original.map(c => c.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('keeps the relative order of existing cards when cards are appended', () => {
    const before = questions(new SeededShuffleStrategy(42).sort(deck(20)));
    const after = questions(new SeededShuffleStrategy(42).sort(deck(25)));
    expect(after.filter(q => before.includes(q))).toEqual(before);
  });

  it('spreads cards around rather than nudging them', () => {
    // Guards the hash: a weak one leaves neighbouring uids next to each other.
    const shuffled = new SeededShuffleStrategy(2026).sort(deck(200));
    const stillAdjacent = shuffled.filter((card, i) =>
      i > 0 && Math.abs(Number(card.question.slice(1)) - Number(shuffled[i - 1].question.slice(1))) === 1).length;
    expect(stillAdjacent).toBeLessThan(10);
  });
});

describe('strategyForOrder', () => {
  it('uses the original order when asked to, whatever seed is lying around', () => {
    expect(strategyForOrder('original', 5)).toBeInstanceOf(ByIndexStrategy);
  });

  it('shuffles for both shuffled modes — they differ in seed lifetime, not mechanism', () => {
    expect(strategyForOrder('shuffledFixed', 5)).toBeInstanceOf(SeededShuffleStrategy);
    expect(strategyForOrder('shuffledEachRun', 5)).toBeInstanceOf(SeededShuffleStrategy);
  });

  it('never hands out 0 as a seed', () => {
    for (let i = 0; i < 1000; i++) expect(newOrderSeed()).toBeGreaterThan(0);
  });
});

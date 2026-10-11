import {ghostFor} from './ghost';

describe('ghostFor', () => {
  describe('plain answers', () => {
    it('shows the whole answer before anything is typed', () => {
      expect(ghostFor('', 'water', false)).toEqual({target: 'water', rest: 'water', onTrack: true});
    });

    it('shows what is still missing', () => {
      expect(ghostFor('wa', 'water', false).rest).toBe('ter');
    });

    it('ignores letter case', () => {
      expect(ghostFor('WA', 'water', false).rest).toBe('ter');
    });

    it('keeps the space the user just typed out of the rest', () => {
      expect(ghostFor('to ', 'to give', false).rest).toBe('give');
    });

    it('follows the alternative being typed', () => {
      const ghost = ghostFor('vol', 'book, volume', false);
      expect(ghost.target).toBe('volume');
      expect(ghost.rest).toBe('ume');
    });

    it('drops parenthetical notes like the validator does', () => {
      expect(ghostFor('', 'to give (something)', false).rest).toBe('to give');
    });

    it('goes off track on a wrong letter', () => {
      expect(ghostFor('wo', 'water', false)).toEqual({target: 'water', rest: '', onTrack: false});
    });

    it('is complete, not off track, once the answer is typed', () => {
      expect(ghostFor('water', 'water', false)).toEqual({target: 'water', rest: '', onTrack: true});
      expect(ghostFor('water ', 'water', false).onTrack).toBeTrue();
    });
  });

  describe('kana answers', () => {
    it('compares romaji after converting it', () => {
      expect(ghostFor('ta', 'たべる', true).rest).toBe('べる');
    });

    it('works on text that is already kana', () => {
      expect(ghostFor('たべ', 'たべる', true).rest).toBe('る');
    });

    it('does not hold half-typed romaji against the user', () => {
      expect(ghostFor('たb', 'たべる', true)).toEqual(jasmine.objectContaining({rest: 'べる', onTrack: true}));
      expect(ghostFor('t', 'たべる', true)).toEqual(jasmine.objectContaining({rest: 'たべる', onTrack: true}));
    });

    it('keeps a lone trailing n open for な, に, ...', () => {
      expect(ghostFor('tan', 'たな', true)).toEqual(jasmine.objectContaining({rest: 'な', onTrack: true}));
      expect(ghostFor('tan', 'たん', true)).toEqual(jasmine.objectContaining({rest: '', onTrack: true}));
    });

    it('treats nn as a settled ん', () => {
      expect(ghostFor('tann', 'たな', true).onTrack).toBeFalse();
    });

    it('converts into katakana when the answer is katakana', () => {
      expect(ghostFor('te', 'テレビ', true).rest).toBe('レビ');
    });

    it('goes off track on wrong kana', () => {
      expect(ghostFor('no', 'たべる', true).onTrack).toBeFalse();
    });
  });
});

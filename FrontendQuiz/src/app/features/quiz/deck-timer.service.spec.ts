import {TestBed} from '@angular/core/testing';
import {DeckTimerService, IDLE_CAP_MS, bestOf, formatDuration} from './deck-timer.service';

describe('formatDuration', () => {
  it('formats minutes and seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(125_000)).toBe('2:05');
  });

  it('adds hours only when needed', () => {
    expect(formatDuration(3_725_000)).toBe('1:02:05');
  });

  it('shows tenths on request, truncated rather than rounded', () => {
    expect(formatDuration(125_390, true)).toBe('2:05.3');
    expect(formatDuration(59_990, true)).toBe('0:59.9');
  });
});

describe('bestOf', () => {
  const record = (ms: number, cards: number) =>
    ({ms, cards, finishedAt: ms, hints: 0, order: 'original' as const});

  it('only compares runs of the same length', () => {
    const records = [record(90_000, 30), record(20_000, 5), record(80_000, 30)];
    expect(bestOf(records, 30)?.ms).toBe(80_000);
    expect(bestOf(records, 5)?.ms).toBe(20_000);
    expect(bestOf(records, 12)).toBeUndefined();
  });
});

describe('DeckTimerService', () => {
  let timer: DeckTimerService;
  const DECK = 'deck-under-test';

  const clearStorage = () => Object.keys(localStorage)
    .filter(k => k.startsWith('quiz_timer_'))
    .forEach(k => localStorage.removeItem(k));

  /** Keystroke, then let `ms` pass. */
  const typeThenWait = (ms: number) => {
    timer.notifyActivity();
    jasmine.clock().tick(ms);
  };

  beforeEach(() => {
    clearStorage();
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 0, 1, 12, 0, 0));
    TestBed.configureTestingModule({});
    timer = TestBed.inject(DeckTimerService);
    timer.setBoardActive(true);
    timer.attach(DECK, 3);
  });

  afterEach(() => {
    timer.detach();
    jasmine.clock().uninstall();
    clearStorage();
  });

  it('does not start until the first keystroke', () => {
    jasmine.clock().tick(10_000);
    timer.notifyActivity();
    jasmine.clock().tick(2_000);
    timer.notifyActivity();

    expect(timer.complete('original').ms).toBe(2_000);
  });

  it('counts the time between keystrokes', () => {
    typeThenWait(4_000);
    typeThenWait(6_000);

    expect(timer.complete('original').ms).toBe(10_000);
  });

  it('caps an idle stretch and shows as paused', () => {
    typeThenWait(IDLE_CAP_MS + 60_000);
    expect(timer.paused()).toBeTrue();
    expect(timer.displayMs()).toBe(IDLE_CAP_MS);

    typeThenWait(5_000);
    expect(timer.complete('original').ms).toBe(IDLE_CAP_MS + 5_000);
  });

  it('stops counting while the board is off screen', () => {
    typeThenWait(3_000);
    timer.setBoardActive(false);
    jasmine.clock().tick(20_000);
    timer.notifyActivity();          // ignored: board not active
    timer.setBoardActive(true);
    typeThenWait(1_000);

    expect(timer.complete('original').ms).toBe(4_000);
  });

  it('records a run only when every card was answered', () => {
    typeThenWait(5_000);
    timer.recordSolved('a');
    timer.recordSolved('b');

    const result = timer.complete('original');
    expect(result.counted).toBeFalse();
    expect(result.solved).toBe(2);
    expect(timer.records().length).toBe(0);
  });

  it('counts a card once however often a rewind makes you answer it', () => {
    typeThenWait(1_000);
    ['a', 'a', 'a'].forEach(uid => timer.recordSolved(uid));

    expect(timer.complete('original').counted).toBeFalse();
  });

  it('flags a new best and reports the one it beat', () => {
    const run = (ms: number) => {
      timer.beginRun();
      typeThenWait(ms);
      ['a', 'b', 'c'].forEach(uid => timer.recordSolved(uid));
      return timer.complete('shuffledEachRun');
    };

    const first = run(9_000);
    expect(first.counted).toBeTrue();
    expect(first.isBest).toBeTrue();
    expect(first.previousBestMs).toBeUndefined();

    const slower = run(12_000);
    expect(slower.isBest).toBeFalse();
    expect(slower.previousBestMs).toBe(9_000);

    const faster = run(7_000);
    expect(faster.isBest).toBeTrue();
    expect(faster.previousBestMs).toBe(9_000);
    expect(timer.best()?.ms).toBe(7_000);
    expect(faster.recent[0].order).toBe('shuffledEachRun');
  });

  it('is idempotent: finishing twice does not log two runs', () => {
    typeThenWait(2_000);
    ['a', 'b', 'c'].forEach(uid => timer.recordSolved(uid));

    const once = timer.complete('original');
    timer.recordSolved('c');
    const twice = timer.complete('original');

    expect(twice).toBe(once);
    expect(timer.records().length).toBe(1);
  });

  it('resumes an unfinished run after a reload', () => {
    typeThenWait(8_000);
    timer.recordSolved('a');
    timer.recordHint();
    timer.detach();                  // persists, like pagehide

    timer.attach(DECK, 3);
    expect(timer.displayMs()).toBe(8_000);

    typeThenWait(2_000);
    ['b', 'c'].forEach(uid => timer.recordSolved(uid));
    const result = timer.complete('original');

    expect(result.ms).toBe(10_000);
    expect(result.hints).toBe(1);
    expect(result.counted).toBeTrue();
  });

  it('summarises a deck for the shelf from full-length runs only', () => {
    const run = (cards: number, uids: string[], ms: number) => {
      timer.setRunCards(cards);
      timer.beginRun();
      typeThenWait(ms);
      uids.forEach(uid => timer.recordSolved(uid));
      timer.complete('original');
    };
    run(3, ['a', 'b', 'c'], 30_000);
    run(1, ['c'], 4_000);             // from a save point: shorter, must not win

    const summary = timer.summaryFor(DECK);
    expect(summary?.bestMs).toBe(30_000);
    expect(summary?.runs).toBe(2);
    expect(timer.summaryFor('never-played')).toBeNull();
  });

  it('reports an untimed result when no deck is attached', () => {
    timer.detach();
    expect(timer.complete('original').timed).toBeFalse();
  });
});

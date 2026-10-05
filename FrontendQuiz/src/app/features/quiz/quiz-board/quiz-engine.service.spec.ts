import {inject, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {QuizEngine} from './quiz-engine.service';
import {DeckStore} from '../../../store/deck.store';
import {DeckContent, PropertyType} from '../../../models/deck.model';
import {PersistedSessionState, SessionSyncService} from '../utils/quiz-session';
import {DeckLockService} from '../utils/quiz-session/deck-lock.service';
import {Card} from '../model/quiz.model';
import {DeckRunResult} from '../deck-timer.service';

const DECK_ID = 'engine-spec-deck';

function makeDeck(size: number): DeckContent {
  return {
    properties: {front: PropertyType.Question, back: PropertyType.Answer},
    cards: Array.from({length: size}, (_, i) => ({front: `q${i}`, back: `a${i}`})),
  };
}

/** Remembers the last state it was asked to save, and hands it back on load — a reload in miniature. */
class FakeSync {
  saved?: PersistedSessionState;
  loadPriorState = async () => this.saved;
  startSync = () => {};
  stopSync = () => {};
  saveNow = (_id: string, session: {serialize(i: number): PersistedSessionState}, index: number) => {
    this.saved = session.serialize(index);
  };
  clearLocal = () => {};
  clearSession = () => { this.saved = undefined; };
}

describe('QuizEngine — card order and timed runs', () => {
  let engine: QuizEngine;
  let sync: FakeSync;
  let current: Card;
  let completed: DeckRunResult[];
  const deckSignal = signal<DeckContent | null>(null);

  const clearStorage = () => Object.keys(localStorage)
    .filter(k => k.startsWith('quiz_'))
    .forEach(k => localStorage.removeItem(k));

  /** Let the deck effect fire and initSession's awaits settle. */
  async function settle(): Promise<void> {
    TestBed.tick();
    for (let i = 0; i < 5; i++) await Promise.resolve();
    TestBed.tick();
  }

  async function boot(): Promise<void> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {provide: SessionSyncService, useValue: sync},
        {provide: DeckLockService, useValue: {status: signal('owner'), claim: async () => 'owner', takeOver: async () => 'owner'}},
        {provide: DeckStore, useValue: {deck: deckSignal, deckId: signal(DECK_ID), deckName: signal('Spec deck')}},
        // Built by hand so the spec does not depend on emitted constructor
        // metadata; the factory still runs in an injection context, so the
        // engine's own inject() calls resolve against the fakes above.
        {provide: QuizEngine, useFactory: () => new QuizEngine(inject(SessionSyncService))},
      ],
    });
    engine = TestBed.inject(QuizEngine);
    completed = [];
    engine.card$.subscribe(card => current = card);
    engine.deckCompleted$.subscribe(run => completed.push(run));
    await settle();
  }

  /** Walk the deck from the current card, answering everything; returns the questions in the order met. */
  function playThrough(): string[] {
    const seen: string[] = [];
    const total = engine.getSession().length;
    for (let i = 0; i < total && completed.length === 0; i++) {
      seen.push(current.question);
      engine.nextCard(true, true);
    }
    return seen;
  }

  const original = Array.from({length: 12}, (_, i) => `q${i}`);

  beforeEach(async () => {
    clearStorage();
    sync = new FakeSync();
    deckSignal.set(makeDeck(12));
    await boot();
  });

  afterEach(clearStorage);

  it('plays a fresh deck in its original order', () => {
    expect(engine.cardOrder).toBe('original');
    expect(playThrough()).toEqual(original);
  });

  it('shuffles on request, restarts at the first card and keeps every card', () => {
    engine.nextCard(true, true);
    engine.nextCard(true, true);

    engine.setCardOrder('shuffledFixed');

    expect(current.index).toBe(0);
    const order = playThrough();
    expect(order).not.toEqual(original);
    expect([...order].sort()).toEqual([...original].sort());
  });

  it('keeps per-card progress across a change of order', () => {
    const firstUid = engine.currentEntry!.uid;
    engine.nextCard(true, true);

    engine.setCardOrder('shuffledFixed');

    expect(engine.getSession().getEntryByUid(firstUid)?.attempts).toBe(1);
  });

  it('"shuffled once" plays the same order on the next run', () => {
    engine.setCardOrder('shuffledFixed');
    const firstRun = playThrough();

    completed = [];
    engine.restartRun();

    expect(playThrough()).toEqual(firstRun);
  });

  it('"shuffled once" survives a reload, cursor included', async () => {
    engine.setCardOrder('shuffledFixed');
    const expected = playThroughPreview();
    engine.nextCard(true, true);
    engine.nextCard(true, true);
    sync.saveNow(DECK_ID, engine.getSession(), 2);
    await settle();                      // let the settings effect write the deck's override

    await boot();                        // "reload"

    expect(engine.cardOrder).toBe('shuffledFixed');
    expect(current.question).toBe(expected[2]);
    expect(playThrough()).toEqual(expected.slice(2));

    function playThroughPreview(): string[] {
      return engine.getSession().getAllEntries().map(e => e.card.question);
    }
  });

  it('"reshuffled every run" deals a new order on restart', () => {
    engine.setCardOrder('shuffledEachRun');
    const firstRun = playThrough();
    expect(completed.length).toBe(1);

    completed = [];
    engine.restartRun();

    expect(current.index).toBe(0);
    const secondRun = playThrough();
    expect(secondRun).not.toEqual(firstRun);
    expect([...secondRun].sort()).toEqual([...original].sort());
  });

  it('"Shuffle again" replaces a fixed order', () => {
    engine.setCardOrder('shuffledFixed');
    const before = engine.getSession().getAllEntries().map(e => e.card.question);

    engine.reshuffle();

    const after = engine.getSession().getAllEntries().map(e => e.card.question);
    expect(after).not.toEqual(before);
  });

  it('going back to the original order restores it exactly', () => {
    engine.setCardOrder('shuffledEachRun');
    engine.setCardOrder('original');
    expect(playThrough()).toEqual(original);
  });

  it('a deck that was never touched opens in original order even after another deck was shuffled', async () => {
    engine.setCardOrder('shuffledFixed');
    await settle();

    localStorage.removeItem('quiz_settings_deck:' + DECK_ID);   // stand-in for "a different deck"
    sync.saved = undefined;
    await boot();

    expect(engine.cardOrder).toBe('original');
  });

  it('reports a counted run when every card was answered', () => {
    playThrough();
    expect(completed.length).toBe(1);
    expect(completed[0].timed).toBeTrue();
    expect(completed[0].counted).toBeTrue();
    expect(completed[0].cards).toBe(12);
  });

  it('does not count a run that was paged through instead of answered', () => {
    for (let i = 0; i < 12; i++) engine.getDeckCommand().nextCard();
    expect(completed.length).toBe(1);
    expect(completed[0].counted).toBeFalse();
  });

  it('a run from a save point only has to cover the cards after it', () => {
    for (let i = 0; i < 8; i++) engine.getDeckCommand().nextCard();
    engine.saveHere();
    engine.restartRun();

    playThrough();

    expect(completed[0].counted).toBeTrue();
    expect(completed[0].cards).toBe(4);
  });
});

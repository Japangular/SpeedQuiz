import {Injectable, NgZone, OnDestroy, computed, inject, signal} from '@angular/core';
import {CardOrderMode} from './utils/quiz-session/sort-strategy';

/**
 * Times a run through a deck and keeps the results, so a finished deck has a
 * number to beat.
 *
 * What counts as time
 * -------------------
 * ACTIVE time, not wall-clock time. A deck is often played across a reload or
 * with the quiz floating over a video, so neither "since the page opened" nor
 * "while the tab is visible" describes the effort. Instead the clock is driven
 * by activity: every keystroke/tap adds the time since the previous one, capped
 * at IDLE_CAP_MS. Thinking for ten seconds counts in full; a coffee break
 * counts as thirty seconds and the clock shows as paused until the next key.
 *
 * Because the accounting happens on events, not on ticks, it is immune to the
 * browser throttling timers in a background tab (exactly the situation the
 * picture-in-picture popout creates) and to the laptop going to sleep. The
 * one-second ticker below exists only to repaint the display.
 *
 * A fresh run starts on the first keystroke, not on deck load.
 *
 * What counts as a record
 * -----------------------
 * Only a run in which every card from the save point to the end was actually
 * answered. Paging to the end with the arrow buttons finishes the deck but
 * does not produce a time. Hints are allowed — the rewind they cause is the
 * penalty — and are counted on the record so clean runs can be told apart.
 *
 * Storage is localStorage, per deck. Records do not sync between devices yet;
 * see the note at the bottom of this file for where that would plug in.
 */

export const IDLE_CAP_MS = 30_000;

const RUN_KEY_PREFIX = 'quiz_timer_run:';
const RECORDS_KEY_PREFIX = 'quiz_timer_records:';
const MAX_RECORDS = 100;
const PERSIST_EVERY_N_TICKS = 10;

export interface DeckRunRecord {
  ms: number;
  finishedAt: number;
  /** Cards the run covered (deck length minus save point). Bests compare like with like. */
  cards: number;
  /** Hints taken during this run. */
  hints: number;
  order: CardOrderMode;
}

export interface DeckRunResult {
  /** False when no clock was running at all (read-only follower tab). Nothing below means anything then. */
  timed: boolean;
  ms: number;
  cards: number;
  solved: number;
  hints: number;
  /** False when not every card was answered in this run — shown, but not recorded. */
  counted: boolean;
  isBest: boolean;
  /** Best time BEFORE this run, for the same card count. */
  previousBestMs?: number;
  /** Newest first, this run included when it counted. */
  recent: DeckRunRecord[];
}

export interface DeckRunSummary {
  bestMs: number;
  runs: number;
  lastFinishedAt: number;
}

interface StoredRun {
  baseMs: number;
  solved: string[];
  hints: number;
}

@Injectable({providedIn: 'root'})
export class DeckTimerService implements OnDestroy {
  private zone = inject(NgZone);

  // ── what the UI reads ─────────────────────────────────────────────────────

  /** True while a deck is attached (false for a read-only follower tab). */
  readonly attached = signal(false);
  /** Elapsed active time, refreshed once a second while the clock runs. */
  readonly displayMs = signal(0);
  /** Clock is stopped waiting for activity: fresh run, idle, or the run is over. */
  readonly paused = signal(true);
  readonly finished = signal(false);
  readonly records = signal<DeckRunRecord[]>([]);

  private readonly runCards = signal(0);

  /** Best recorded time for a run of the current length. */
  readonly best = computed(() => bestOf(this.records(), this.runCards()));

  // ── run state ─────────────────────────────────────────────────────────────

  private deckId: string | null = null;
  private boardActive = false;

  /** Time banked so far. The live value is this plus the open interval below. */
  private baseMs = 0;
  /** Start of the open interval; null = clock stopped, next activity restarts it without adding time. */
  private lastActivity: number | null = null;
  private solved = new Set<string>();
  private hints = 0;
  private lastResult: DeckRunResult | null = null;

  private ticker?: ReturnType<typeof setInterval>;
  private ticksSincePersist = 0;

  private readonly onPageHide = () => this.persist();

  constructor() {
    window.addEventListener('pagehide', this.onPageHide);
    window.addEventListener('beforeunload', this.onPageHide);
  }

  ngOnDestroy(): void {
    window.removeEventListener('pagehide', this.onPageHide);
    window.removeEventListener('beforeunload', this.onPageHide);
    this.persist();
    this.stopTicker();
  }

  // ── lifecycle, driven by QuizEngine ───────────────────────────────────────

  /** Pick up the deck's unfinished run if there is one, else arm a fresh one. */
  attach(deckId: string, runCards: number): void {
    if (this.deckId && this.deckId !== deckId) this.persist();
    this.stopClock();

    this.deckId = deckId;
    this.lastResult = null;

    const stored = read<StoredRun>(RUN_KEY_PREFIX + deckId);
    this.baseMs = Math.max(0, stored?.baseMs ?? 0);
    this.solved = new Set(stored?.solved ?? []);
    this.hints = stored?.hints ?? 0;

    this.runCards.set(runCards);
    this.records.set(read<DeckRunRecord[]>(RECORDS_KEY_PREFIX + deckId) ?? []);
    this.attached.set(true);
    this.finished.set(false);
    this.paused.set(true);
    this.displayMs.set(this.baseMs);
  }

  detach(): void {
    this.persist();
    this.stopClock();
    this.deckId = null;
    this.lastResult = null;
    this.attached.set(false);
  }

  /** Zero the clock. The run starts counting on the next keystroke. */
  beginRun(): void {
    if (!this.deckId) return;
    this.stopClock();
    this.baseMs = 0;
    this.solved.clear();
    this.hints = 0;
    this.lastResult = null;
    this.finished.set(false);
    this.paused.set(true);
    this.displayMs.set(0);
    remove(RUN_KEY_PREFIX + this.deckId);
  }

  /** Save point moved: the run now covers a different number of cards. */
  setRunCards(runCards: number): void {
    this.runCards.set(runCards);
  }

  /** The quiz board is on screen. Leaving it banks the time and stops the clock. */
  setBoardActive(active: boolean): void {
    this.boardActive = active;
    if (!active) {
      this.bank(Date.now());
      this.persist();
    }
  }

  // ── events ────────────────────────────────────────────────────────────────

  /**
   * A character went into an answer field. The only thing that starts the
   * clock, on a fresh run and again after an idle pause.
   */
  notifyTyping(): void {
    this.registerActivity(true);
  }

  /**
   * Any other keystroke or tap on the board. Keeps a running clock running,
   * but never starts a stopped one: clicking into the window isn't playing.
   */
  notifyActivity(): void {
    this.registerActivity(false);
  }

  private registerActivity(canStart: boolean): void {
    if (!this.deckId || !this.boardActive || this.lastResult) return;

    const now = Date.now();
    // Went idle without a tick noticing (throttled background tab, sleep):
    // bank the capped stretch so a click can't carry the clock through it.
    if (this.lastActivity !== null && now - this.lastActivity >= IDLE_CAP_MS) {
      this.bank(now);
    }

    if (this.lastActivity === null) {
      if (!canStart) return;
    } else {
      this.baseMs += now - this.lastActivity;
    }
    this.lastActivity = now;

    if (this.paused()) this.paused.set(false);
    this.startTicker();
  }

  recordSolved(uid: string): void {
    if (!this.deckId || this.lastResult) return;
    this.solved.add(uid);
    this.persist();
  }

  recordHint(): void {
    if (!this.deckId || this.lastResult) return;
    this.hints++;
    this.persist();
  }

  /**
   * The deck was finished. Idempotent: re-answering the last card after
   * closing the dialog returns the same result instead of logging a second run.
   */
  complete(order: CardOrderMode): DeckRunResult {
    if (this.lastResult) return this.lastResult;
    if (!this.deckId) {
      return {timed: false, ms: 0, cards: 0, solved: 0, hints: 0, counted: false, isBest: false, recent: []};
    }

    const cards = this.runCards();
    const ms = Math.round(this.currentMs(Date.now()));
    this.stopClock();
    this.baseMs = ms;

    const counted = cards > 0 && this.solved.size >= cards;
    const previous = this.records();
    const previousBestMs = bestOf(previous, cards)?.ms;

    let all = previous;
    if (counted) {
      const record: DeckRunRecord = {ms, finishedAt: Date.now(), cards, hints: this.hints, order};
      all = trim([...previous, record]);
      write(RECORDS_KEY_PREFIX + this.deckId, all);
      this.records.set(all);
    }
    remove(RUN_KEY_PREFIX + this.deckId);

    this.lastResult = {
      timed: true,
      ms,
      cards,
      solved: this.solved.size,
      hints: this.hints,
      counted,
      isBest: counted && (previousBestMs === undefined || ms < previousBestMs),
      previousBestMs,
      recent: [...all].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, 5),
    };

    this.finished.set(true);
    this.paused.set(true);
    this.displayMs.set(ms);
    return this.lastResult;
  }

  // ── reads for other screens (deck shelf) ──────────────────────────────────

  /** Best full-length run of a deck, or null if it has never been finished on the clock. */
  summaryFor(deckId: string): DeckRunSummary | null {
    const records = read<DeckRunRecord[]>(RECORDS_KEY_PREFIX + deckId) ?? [];
    if (records.length === 0) return null;

    // A run from a save point covers fewer cards and would always "win".
    const fullLength = Math.max(...records.map(r => r.cards));
    const best = bestOf(records, fullLength);
    if (!best) return null;

    return {
      bestMs: best.ms,
      runs: records.length,
      lastFinishedAt: Math.max(...records.map(r => r.finishedAt)),
    };
  }

  /** Deck deleted: drop its run and its records. */
  forgetDeck(deckId: string): void {
    remove(RUN_KEY_PREFIX + deckId);
    remove(RECORDS_KEY_PREFIX + deckId);
    if (this.deckId === deckId) this.detach();
  }

  // ── internals ─────────────────────────────────────────────────────────────

  private currentMs(now: number): number {
    const open = this.lastActivity === null ? 0 : Math.min(now - this.lastActivity, IDLE_CAP_MS);
    return this.baseMs + open;
  }

  /** Close the open interval into baseMs and stop. */
  private bank(now: number): void {
    this.baseMs = this.currentMs(now);
    this.stopClock();
    if (this.attached()) {
      this.paused.set(true);
      this.displayMs.set(this.baseMs);
    }
  }

  private stopClock(): void {
    this.lastActivity = null;
    this.stopTicker();
  }

  private startTicker(): void {
    if (this.ticker !== undefined) return;
    // Outside the zone: a 1 Hz interval inside it would run change detection
    // for the whole app every second, including while nothing is changing.
    this.zone.runOutsideAngular(() => {
      this.ticker = setInterval(() => this.tick(), 1000);
    });
  }

  private stopTicker(): void {
    if (this.ticker === undefined) return;
    clearInterval(this.ticker);
    this.ticker = undefined;
  }

  private tick(): void {
    const now = Date.now();

    if (this.lastActivity !== null && now - this.lastActivity >= IDLE_CAP_MS) {
      // Idle: bank the capped interval and wait for the next keystroke.
      this.zone.run(() => this.bank(now));
      this.persist();
      return;
    }

    const ms = this.currentMs(now);
    if (Math.floor(ms / 1000) !== Math.floor(this.displayMs() / 1000)) {
      this.zone.run(() => this.displayMs.set(ms));
    }

    if (++this.ticksSincePersist >= PERSIST_EVERY_N_TICKS) this.persist();
  }

  private persist(): void {
    this.ticksSincePersist = 0;
    if (!this.deckId || this.lastResult) return;
    const baseMs = Math.round(this.currentMs(Date.now()));
    if (baseMs === 0 && this.solved.size === 0) return;   // untouched run: nothing worth keeping
    write(RUN_KEY_PREFIX + this.deckId, {baseMs, solved: [...this.solved], hints: this.hints} satisfies StoredRun);
  }
}

// ── pure helpers ────────────────────────────────────────────────────────────

/** Fastest record among runs that covered `cards` cards. */
export function bestOf(records: readonly DeckRunRecord[], cards: number): DeckRunRecord | undefined {
  let best: DeckRunRecord | undefined;
  for (const record of records) {
    if (record.cards !== cards) continue;
    if (!best || record.ms < best.ms) best = record;
  }
  return best;
}

/** `2:05`, `1:02:05`; with `tenths`, `2:05.3` — for results, where a second is too coarse. */
export function formatDuration(ms: number, tenths = false): string {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  const head = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  return tenths ? `${head}.${Math.floor((safe % 1000) / 100)}` : head;
}

/** Keep the newest MAX_RECORDS — but never drop a best, however old it is. */
function trim(records: DeckRunRecord[]): DeckRunRecord[] {
  if (records.length <= MAX_RECORDS) return records;
  const newest = [...records].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, MAX_RECORDS);
  const kept = new Set(newest);
  for (const cards of new Set(records.map(r => r.cards))) {
    const best = bestOf(records, cards);
    if (best && !kept.has(best)) {
      newest.push(best);
      kept.add(best);
    }
  }
  return newest.sort((a, b) => a.finishedAt - b.finishedAt);
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage disabled or full — times just won't persist */ }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch { /* storage disabled */ }
}

/*
 * Syncing records between devices: the natural carrier is the `_session` state
 * blob that SessionSyncService already posts. It would need (1) an optional
 * `runs?: DeckRunRecord[]` on PersistedSessionState, (2) mergeSessionStates to
 * union the two lists by `finishedAt`, and (3) QuizEngine.resetSession to carry
 * the list over, since "Reset progress" wipes the blob and records should
 * outlive that. Left out on purpose until the local version has proven itself.
 */

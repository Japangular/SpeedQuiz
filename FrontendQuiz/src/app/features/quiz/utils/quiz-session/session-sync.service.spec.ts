import {Injector, runInInjectionContext, signal} from '@angular/core';
import {BehaviorSubject, defer, firstValueFrom, Observable, of, Subject, throwError} from 'rxjs';

import {SessionSyncService, StampedSessionState} from './session-sync.service';
import {PersistedCardState, PersistedSessionState, QuizSession, SESSION_STATE_VERSION} from './quiz-session';
import {QuizApiService} from '../../../../services/quiz-api.service';
import {QuizSettingsService} from '../../quiz-settings.service';
import {LocalProfileService} from '../../../../user-store-management/local-profile.service';
import {OfflineModeService} from '../../../../services/offline-mode.service';
import {DeckCardState} from '../../../../models/deck.model';

/*
 * Two devices, one server. Each Device gets its own SessionSyncService, its
 * own offline switch and its own localStorage (swapped in by use()); the
 * FakeServer row is shared, like the real deck_card_state row.
 */

const DECK = 'sync-spec-deck';
const LOCAL_PREFIX = 'quiz_session_';

const byNumber = (a: string, b: string) => Number(a.slice(1)) - Number(b.slice(1));
const range = (from: number, to: number) => Array.from({length: to - from}, (_, i) => `c${from + i}`);

/** The part of QuizSession that SessionSyncService touches. */
class FakeSession {
  readonly dirty$ = new BehaviorSubject(false);
  private readonly records = new Map<string, PersistedCardState>();
  private cursorUid: string | null;

  constructor(prior?: PersistedSessionState) {
    for (const record of prior?.cards ?? []) this.records.set(record.uid, record);
    this.cursorUid = prior?.cursorUid ?? null;
  }

  answer(uid: string): void {
    this.records.set(uid, {
      uid, hintUsed: false, attempts: 1, solvedWithoutHint: true, solvedExactly: true, solvedAt: Date.now(),
    });
    this.cursorUid = uid;
    this.dirty$.next(true);
  }

  markClean(): void {
    this.dirty$.next(false);
  }

  serialize(): PersistedSessionState {
    return {
      version: SESSION_STATE_VERSION, cursorUid: this.cursorUid, anchorUid: null, hintUsedHere: false,
      cards: [...this.records.values()],
    };
  }

  uids(): string[] {
    return [...this.records.keys()].sort(byNumber);
  }
}

/** The deck's `_session` row on the backend. */
class FakeServer {
  row?: string;

  get state(): StampedSessionState | undefined {
    return this.row ? JSON.parse(this.row) as StampedSessionState : undefined;
  }

  uids(): string[] {
    return (this.state?.cards ?? []).map(c => c.uid).sort(byNumber);
  }

  solvedAt(uid: string): number | undefined {
    return this.state?.cards.find(c => c.uid === uid)?.solvedAt;
  }
}

class Device {
  readonly offline = signal(false);
  private readonly reconnected = new Subject<void>();
  readonly sync: SessionSyncService;
  session?: FakeSession;
  /** This device's localStorage entries while another device is the active one. */
  stored: [string, string][] = [];

  constructor(server: FakeServer) {
    const api = {
      getCardStates: (): Observable<DeckCardState[]> => defer(() => this.offline()
        ? throwError(() => new Error('offline'))
        : of(server.row === undefined ? [] : [{deckId: DECK, cardId: '_session', state: server.row}])),
      updateCardStates: (_: string, states: DeckCardState[]): Observable<unknown> => defer(() => {
        if (this.offline()) return throwError(() => new Error('offline'));
        server.row = states[0].state;
        return of({});
      }),
    };
    const injector = Injector.create({
      providers: [
        {provide: QuizSettingsService, useValue: {sessionSyncDebounceMs: () => 0}},
        {provide: LocalProfileService, useValue: {getToken: () => null}},
        {provide: OfflineModeService, useValue: {offline: this.offline, reconnected$: this.reconnected.asObservable()}},
      ],
    });
    this.sync = runInInjectionContext(injector, () => new SessionSyncService(api as unknown as QuizApiService));
  }

  goOffline(): void {
    this.offline.set(true);
  }

  reconnect(): void {
    use(this);
    this.offline.set(false);
    this.reconnected.next();
    settle();
  }
}

// ── device switching ────────────────────────────────────────────────────────

let active: Device | undefined;

/** Makes `device` the one whose localStorage is live. */
function use(device: Device): Device {
  if (active === device) return device;
  if (active) active.stored = takeStorage();
  for (const [key, value] of device.stored) localStorage.setItem(key, value);
  device.stored = [];
  active = device;
  return device;
}

function takeStorage(): [string, string][] {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(LOCAL_PREFIX));
  const entries = keys.map(k => [k, localStorage.getItem(k)!] as [string, string]);
  keys.forEach(k => localStorage.removeItem(k));
  return entries;
}

// ── what a user does ────────────────────────────────────────────────────────

/** Lets the (zero) save debounce fire. */
function settle(): void {
  jasmine.clock().tick(10);
}

/** Opens the deck, as QuizEngine.initSession does: load, build a session from it, start syncing. */
async function open(device: Device): Promise<FakeSession> {
  use(device);
  const prior = await device.sync.loadPriorState(DECK);
  const session = new FakeSession(prior);
  device.session = session;
  device.sync.startSync(DECK, session as unknown as QuizSession, () => 0);
  settle();
  return session;
}

/** Answers cards c{from} .. c{to - 1}, a second apart. */
function study(device: Device, from: number, to: number): void {
  use(device);
  for (let i = from; i < to; i++) {
    jasmine.clock().tick(1_000);
    device.session!.answer(`c${i}`);
    settle();
  }
}

/** "Reset progress", as QuizEngine.resetSession does it. */
function resetProgress(device: Device): void {
  use(device);
  device.sync.stopSync();
  device.sync.clearLocal(DECK);
  device.sync.clearSession(DECK);
  const session = new FakeSession();
  device.session = session;
  device.sync.startSync(DECK, session as unknown as QuizSession, () => 0);
  settle();
}

function close(device: Device): void {
  device.sync.stopSync();
  device.session = undefined;
}

// ── specs ───────────────────────────────────────────────────────────────────

describe('SessionSyncService across devices', () => {
  let server: FakeServer;
  let desktop: Device;
  let phone: Device;

  beforeEach(() => {
    takeStorage();
    active = undefined;
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 9, 12, 18, 0, 0));
    server = new FakeServer();
    desktop = new Device(server);
    phone = new Device(server);
  });

  afterEach(() => {
    for (const device of [desktop, phone]) device.sync.ngOnDestroy();
    jasmine.clock().uninstall();
    takeStorage();
    active = undefined;
  });

  it('keeps offline progress from the phone when the desktop saves before the phone is back online', async () => {
    await open(desktop);
    study(desktop, 0, 50);
    close(desktop);

    await open(phone);
    study(phone, 50, 80);
    phone.goOffline();               // the laundromat
    study(phone, 80, 150);
    close(phone);
    expect(server.uids()).toEqual(range(0, 80));

    phone.offline.set(false);        // home again, app not open

    const onDesktop = await open(desktop);
    expect(onDesktop.uids()).toEqual(range(0, 80));   // cannot know about the phone yet
    study(desktop, 80, 100);
    const answeredOnDesktop = server.solvedAt('c90');
    close(desktop);

    const onPhone = await open(phone);
    expect(onPhone.uids()).toEqual(range(0, 150));
    expect(server.uids()).toEqual(range(0, 150));
    // A card answered on both: the later answer is the one kept.
    expect(server.solvedAt('c90')).toBe(answeredOnDesktop);
  });

  it('sends what failed to save as soon as the connection is back, without another answer', async () => {
    await open(phone);
    study(phone, 0, 10);
    phone.goOffline();
    study(phone, 10, 20);
    expect(server.uids()).toEqual(range(0, 10));

    phone.reconnect();

    expect(server.uids()).toEqual(range(0, 20));
  });

  it('merges with what another device saved in the meantime instead of overwriting it', async () => {
    await open(desktop);
    study(desktop, 0, 10);
    await open(phone);
    phone.goOffline();
    study(phone, 10, 20);
    study(desktop, 20, 30);          // still open on the desktop, saved

    phone.reconnect();

    expect(server.uids()).toEqual(range(0, 30));
  });

  it('opens from the local copy when the server is unreachable, and syncs it later', async () => {
    await open(phone);
    study(phone, 0, 10);
    close(phone);

    phone.goOffline();
    const offline = await open(phone);
    expect(offline.uids()).toEqual(range(0, 10));
    study(phone, 10, 12);

    phone.reconnect();

    expect(server.uids()).toEqual(range(0, 12));
  });

  describe('resets', () => {
    it('do not come back from another device holding older progress', async () => {
      await open(phone);
      study(phone, 0, 10);
      close(phone);

      await open(desktop);
      resetProgress(desktop);
      study(desktop, 0, 3);
      close(desktop);

      const onPhone = await open(phone);
      expect(onPhone.uids()).toEqual(range(0, 3));
      expect(server.uids()).toEqual(range(0, 3));
    });

    it('keep answers another device gave after the reset, offline and unaware of it', async () => {
      await open(phone);
      study(phone, 0, 10);
      phone.goOffline();

      await open(desktop);
      resetProgress(desktop);
      close(desktop);

      study(phone, 10, 15);
      phone.reconnect();
      expect(server.uids()).toEqual(range(10, 15));

      close(phone);
      const reopened = await open(phone);
      expect(reopened.uids()).toEqual(range(10, 15));
    });

    it('also happen through an import that replaces progress', async () => {
      await open(phone);
      study(phone, 0, 10);
      close(phone);

      const longAgo = Date.now() - 86_400_000;
      const imported: StampedSessionState = {
        version: SESSION_STATE_VERSION, cursorUid: null, anchorUid: null, hintUsedHere: false,
        cards: [
          {uid: 'c0', hintUsed: false, attempts: 4, solvedWithoutHint: true, solvedAt: longAgo},
          {uid: 'c50', hintUsed: false, attempts: 1, solvedWithoutHint: true, solvedAt: longAgo},
        ],
      };
      use(desktop);
      await firstValueFrom(desktop.sync.writeState(DECK, imported, {replace: true}));

      const onPhone = await open(phone);
      expect(onPhone.uids()).toEqual(['c0', 'c50']);
      expect(server.state?.cards.find(c => c.uid === 'c0')?.attempts).toBe(4);
    });
  });
});

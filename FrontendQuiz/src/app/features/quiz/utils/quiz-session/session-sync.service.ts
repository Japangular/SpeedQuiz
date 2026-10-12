import {inject, Injectable, OnDestroy} from '@angular/core';
import {
  catchError, debounce, defer, filter, firstValueFrom, map, merge, Observable, of, Subscription, switchMap, tap,
  timer,
} from 'rxjs';

import {QuizSession, PersistedSessionState, SESSION_STATE_VERSION} from './quiz-session';
import {mergeSessionStates} from './session-state-merge';
import {QuizApiService} from '../../../../services/quiz-api.service';
import {QuizSettingsService} from '../../quiz-settings.service';
import {LocalProfileService} from '../../../../user-store-management/local-profile.service';
import {environment} from '../../../../environments/environment';
import {OfflineModeService} from '../../../../services/offline-mode.service';
import {DeckCardState} from '../../../../models/deck.model';

/**
 * A state blob plus when it was written. `savedAt` and `resetAt` are additive
 * and optional, so SESSION_STATE_VERSION deliberately stays at 2 — bumping it
 * would make QuizSession.restore() discard every state written before them.
 *
 * `resetAt` is when the deck's progress was last reset: "Reset progress", or
 * an import that replaced it. mergeSessionStates uses it so a reset on one
 * device is not undone by another device's older copy.
 */
export type StampedSessionState = PersistedSessionState & {savedAt?: number; resetAt?: number};

/** The server's copy, or that there was no way to ask. "Unreachable" is not "nothing there". */
type RemoteRead = {reachable: true; state: StampedSessionState | undefined} | {reachable: false};

const UNREACHABLE: RemoteRead = {reachable: false};

/** The deck_card_state row that holds the whole session blob. */
const SESSION_CARD_ID = '_session';

/**
 * Keeps a deck's session state in two places, this device's local storage
 * and the server, and reconciles them.
 *
 * Both directions merge rather than overwrite (mergeSessionStates):
 *  - Loading merges the local copy with the server's, so progress made
 *    offline survives another device having saved in the meantime.
 *  - Saving reads the server's copy first and writes the merge, so this
 *    device never wipes progress another device put there.
 *
 * A save that fails leaves the deck owed: it is retried when the connection
 * comes back, without waiting for the next answer.
 *
 * Known gap: two devices saving within the same moment can still overwrite
 * each other's server copy. Nothing is lost by it, because each device keeps
 * its own copy and merges it in on its next load or save, but the server can
 * lag behind until then. Versioned writes (or an append-only event log) would
 * close it.
 */
@Injectable({providedIn: 'root'})
export class SessionSyncService implements OnDestroy {
  private static readonly LOCAL_KEY_PREFIX = 'quiz_session_';

  private syncSub?: Subscription;
  private currentDeckId?: string;
  private currentSession?: QuizSession;
  private currentIndexFn?: () => number;

  /**
   * Decks whose latest state here has not reached the server: a save failed,
   * or a load found progress here that the server lacks. In memory only —
   * after a reload, loadPriorState finds the gap again by comparing copies.
   */
  private readonly unsynced = new Set<string>();

  /** The last server copy seen per deck. Merged into the save on unload, which has no time to read first. */
  private readonly knownRemote = new Map<string, StampedSessionState | undefined>();

  /**
   * The reset the loaded session was built from, per deck; stamped onto every
   * save of it. Set only by a load or a reset here, never from a server copy
   * read mid-session: a session that claimed a reset it was not built from
   * would carry its pre-reset records past the merge.
   */
  private readonly resetAt = new Map<string, number>();

  private settings = inject(QuizSettingsService);
  private profile = inject(LocalProfileService);
  private offlineMode = inject(OfflineModeService);

  private readonly beforeUnloadHandler = () => this.saveOnUnload();

  constructor(private quizApi: QuizApiService) {
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    // pagehide is the one that actually fires on iOS Safari, where
    // beforeunload is unreliable. Both are idempotent, so firing twice is fine.
    window.addEventListener('pagehide', this.beforeUnloadHandler);
  }

  // ── loading ───────────────────────────────────────────────────────────────

  /**
   * The state to start a session from: the local copy merged with the
   * server's, card by card.
   *
   * It used to be one or the other, whichever was saved later, and that lost
   * work. Study offline on the phone, study on the desktop before the phone is
   * back online, and the desktop's newer copy replaced the phone's on its next
   * load, offline answers included.
   *
   * When the local copy holds something the server lacks, the deck is marked
   * as owed a save, which startSync sends.
   */
  async loadPriorState(deckId: string): Promise<StampedSessionState | undefined> {
    const local = this.readLocal(deckId);
    const remote = await firstValueFrom(this.fetchRemote(deckId));

    let result: StampedSessionState | undefined;
    if (!remote.reachable || !remote.state) {
      result = local;
      if (local) this.unsynced.add(deckId);
    } else if (!local) {
      result = remote.state;
      this.writeLocal(deckId, result);
    } else {
      result = mergeSessionStates(remote.state, local);
      this.writeLocal(deckId, result);
      if (addsToRemote(local, remote.state, result)) this.unsynced.add(deckId);
    }

    this.adoptReset(deckId, result?.resetAt);
    return result;
  }

  /** The freshest state for a deck, for export: local and server merged. Does not touch local storage. */
  async snapshotFor(deckId: string): Promise<StampedSessionState | undefined> {
    const local = this.readLocal(deckId);
    const remote = await firstValueFrom(this.fetchRemote(deckId));
    const server = remote.reachable ? remote.state : undefined;
    if (!server) return local;
    if (!local) return server;
    return mergeSessionStates(server, local);
  }

  // ── saving ────────────────────────────────────────────────────────────────

  startSync(deckId: string, session: QuizSession, getCurrentIndex: () => number): void {
    this.stopSync();
    this.currentDeckId = deckId;
    this.currentSession = session;
    this.currentIndexFn = getCurrentIndex;

    const changed$ = session.dirty$.pipe(
      filter(dirty => dirty),
      // debounce() re-reads the setting on every emission, so changing the
      // slider takes effect immediately. debounceTime() would have frozen
      // whatever value was current when startSync ran.
      debounce(() => timer(this.settings.sessionSyncDebounceMs())),
    );

    // A save owed from before — found by loadPriorState, or left by a save
    // that failed — goes out at once, and again whenever the connection
    // comes back.
    const owed$ = merge(of(undefined), this.offlineMode.reconnected$).pipe(
      filter(() => this.unsynced.has(deckId)),
    );

    this.syncSub = merge(changed$, owed$).pipe(
      map(() => this.stamp(deckId, session, getCurrentIndex())),
      tap(state => this.writeLocal(deckId, state)),
      switchMap(state => this.push(deckId, state)),
    ).subscribe(saved => {
      // Clean only once the save arrived. Marking it clean after a failure,
      // as before, meant nothing was retried until the next answer, so the
      // end of an offline session never reached the server.
      if (saved) session.markClean();
    });
  }

  saveNow(deckId: string, session: QuizSession, currentIndex: number): void {
    const state = this.stamp(deckId, session, currentIndex);
    this.writeLocal(deckId, state);
    this.push(deckId, state).subscribe(saved => {
      if (saved) session.markClean();
    });
  }

  /**
   * Used by deck import to seed progress. With `replace`, the state counts as
   * a reset at this moment: other devices' older progress for the deck is
   * dropped when they next merge, instead of flowing back in.
   */
  writeState(
    deckId: string,
    state: StampedSessionState,
    options: {replace?: boolean} = {},
  ): Observable<unknown> {
    const now = Date.now();
    const stamped: StampedSessionState = {...state, savedAt: now};
    if (options.replace) stamped.resetAt = now;
    this.writeLocal(deckId, stamped);
    return this.save(deckId, stamped).pipe(
      tap({error: () => this.unsynced.add(deckId)}),
    );
  }

  stopSync(): void {
    this.syncSub?.unsubscribe();
    this.syncSub = undefined;
    this.currentSession = undefined;
    this.currentIndexFn = undefined;
  }

  clearLocal(deckId: string): void {
    try {
      localStorage.removeItem(SessionSyncService.LOCAL_KEY_PREFIX + deckId);
    } catch { /* storage unavailable */ }
  }

  /**
   * Forgets the deck's progress, here and on the server. Writes an empty state
   * stamped with the moment of the reset instead of deleting the row, so the
   * reset reaches other devices: their older progress is dropped when they
   * next merge, rather than pushed back up.
   */
  clearSession(deckId: string): void {
    const now = Date.now();
    const reset: StampedSessionState = {
      version: SESSION_STATE_VERSION,
      cursorUid: null,
      anchorUid: null,
      hintUsedHere: false,
      cards: [],
      savedAt: now,
      resetAt: now,
    };
    this.resetAt.set(deckId, now);
    this.writeLocal(deckId, reset);
    this.send(deckId, reset).subscribe();
  }

  /** Drops every cached session blob. Called when the device adopts a new identity. */
  clearAllLocal(): void {
    this.unsynced.clear();
    this.knownRemote.clear();
    this.resetAt.clear();
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(SessionSyncService.LOCAL_KEY_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch { /* storage unavailable */ }
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    window.removeEventListener('pagehide', this.beforeUnloadHandler);
    this.stopSync();
  }

  // ── internals ─────────────────────────────────────────────────────────────

  private stamp(deckId: string, session: QuizSession, index: number): StampedSessionState {
    const resetAt = this.resetAt.get(deckId);
    return {
      ...session.serialize(index),
      savedAt: Date.now(),
      ...(resetAt !== undefined ? {resetAt} : {}),
    };
  }

  private adoptReset(deckId: string, resetAt: number | undefined): void {
    if (resetAt === undefined) this.resetAt.delete(deckId);
    else this.resetAt.set(deckId, resetAt);
  }

  /**
   * Read, merge, write. The server may hold progress from another device that
   * this session has never seen; writing this device's state over it would
   * wipe that progress from the server. Merging first keeps both.
   *
   * Emits false when the server cannot be reached; the deck is then owed a
   * save, retried on reconnect.
   */
  private push(deckId: string, state: StampedSessionState): Observable<boolean> {
    return this.fetchRemote(deckId).pipe(
      switchMap(remote => {
        if (!remote.reachable) {
          this.unsynced.add(deckId);
          return of(false);
        }
        return this.send(deckId, mergeSessionStates(remote.state, state));
      }),
    );
  }

  /** Plain write, no merge: for a merge already made, and for a reset, which is meant to replace. */
  private send(deckId: string, state: StampedSessionState): Observable<boolean> {
    return defer(() => {
      if (this.offlineMode.offline()) throw new Error('offline');
      return this.save(deckId, state);
    }).pipe(
      map(() => {
        this.knownRemote.set(deckId, state);
        this.unsynced.delete(deckId);
        return true;
      }),
      catchError(() => {
        this.unsynced.add(deckId);
        return of(false);
      }),
    );
  }

  private fetchRemote(deckId: string): Observable<RemoteRead> {
    return defer(() => {
      if (this.offlineMode.offline()) return of(UNREACHABLE);
      return this.quizApi.getCardStates(deckId).pipe(
        map((states): RemoteRead => ({reachable: true, state: parseSessionRow(states)})),
        tap(read => {
          if (read.reachable) this.knownRemote.set(deckId, read.state);
        }),
        catchError(() => {
          console.warn(`SessionSync: could not read remote state for deck ${deckId}`);
          return of(UNREACHABLE);
        }),
      );
    });
  }

  /**
   * Closing the tab used to write local storage only, so the last few seconds
   * of a session never reached the server and the next device saw stale state.
   *
   * fetch(keepalive) rather than sendBeacon, because the request needs the
   * X-Session-Token header and sendBeacon cannot set one. There is no time to
   * read the server's copy first, so the save is merged with the last copy
   * seen instead; usually that is the current one.
   */
  private saveOnUnload(): void {
    if (!this.currentDeckId || !this.currentSession || !this.currentIndexFn) return;

    const deckId = this.currentDeckId;
    const state = this.stamp(deckId, this.currentSession, this.currentIndexFn());
    this.writeLocal(deckId, state);

    if (this.offlineMode.offline()) return;

    const token = this.profile.getToken();
    if (!token) return;

    const merged = mergeSessionStates(this.knownRemote.get(deckId), state);
    try {
      fetch(`${environment.apiBaseUrl}/quizApi/decks/${deckId}/state`, {
        method: 'POST',
        keepalive: true,
        headers: {'Content-Type': 'application/json', 'X-Session-Token': token},
        body: JSON.stringify([{
          deckId,
          cardId: SESSION_CARD_ID,
          state: JSON.stringify(merged),
        }]),
      });
    } catch {
      // Nothing useful to do during unload; the local copy is the fallback.
    }
  }

  private save(deckId: string, sessionState: StampedSessionState): Observable<unknown> {
    return this.quizApi.updateCardStates(deckId, [{
      deckId,
      cardId: SESSION_CARD_ID,
      state: JSON.stringify(sessionState),
    }]);
  }

  private writeLocal(deckId: string, state: StampedSessionState): void {
    try {
      localStorage.setItem(
        SessionSyncService.LOCAL_KEY_PREFIX + deckId,
        JSON.stringify(state),
      );
    } catch { /* storage full — the server copy is the fallback */ }
  }

  private readLocal(deckId: string): StampedSessionState | undefined {
    try {
      const raw = localStorage.getItem(SessionSyncService.LOCAL_KEY_PREFIX + deckId);
      return raw ? JSON.parse(raw) as StampedSessionState : undefined;
    } catch {
      return undefined;
    }
  }
}

/**
 * The session blob among the deck's state rows, picked by its id rather than
 * by position. Unparseable content counts as no state, so a corrupt row is
 * overwritten by the next save instead of blocking every save after it.
 */
function parseSessionRow(states: readonly DeckCardState[] | null | undefined): StampedSessionState | undefined {
  const row = states?.find(s => s.cardId === SESSION_CARD_ID);
  if (!row?.state) return undefined;
  try {
    return JSON.parse(row.state) as StampedSessionState;
  } catch {
    return undefined;
  }
}

/**
 * True when merging `local` into `remote` kept anything only `local` had: a
 * card record, a later position, or a later reset. The server is then behind
 * this device and owed a save.
 */
function addsToRemote(
  local: StampedSessionState,
  remote: StampedSessionState,
  merged: StampedSessionState,
): boolean {
  const fromLocal = new Set(local.cards ?? []);
  return merged.cards.some(card => fromLocal.has(card))
    || (local.savedAt ?? 0) > (remote.savedAt ?? 0)
    || (local.resetAt ?? 0) > (remote.resetAt ?? 0);
}

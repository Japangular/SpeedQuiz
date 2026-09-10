import {inject, Injectable, OnDestroy} from '@angular/core';
import {debounce, filter, Observable, Subscription, switchMap, tap, timer, map, of} from 'rxjs';

import {QuizSession, PersistedSessionState} from './quiz-session';
import {QuizApiService} from '../../../../services/quiz-api.service';
import {QuizSettingsService} from '../../quiz-settings.service';
import {LocalProfileService} from '../../../../user-store-management/local-profile.service';
import {environment} from '../../../../environments/environment';

/**
 * A state blob plus when it was written. `savedAt` is additive and optional,
 * so SESSION_STATE_VERSION deliberately stays at 2 — bumping it would make
 * QuizSession.restore() discard every state written before this change.
 */
export type StampedSessionState = PersistedSessionState & {savedAt?: number};

@Injectable({providedIn: 'root'})
export class SessionSyncService implements OnDestroy {
  private static readonly LOCAL_KEY_PREFIX = 'quiz_session_';

  private syncSub?: Subscription;
  private currentDeckId?: string;
  private currentSession?: QuizSession;
  private currentIndexFn?: () => number;

  private settings = inject(QuizSettingsService);
  private profile = inject(LocalProfileService);

  private readonly beforeUnloadHandler = () => this.saveOnUnload();

  constructor(private quizApi: QuizApiService) {
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    // pagehide is the one that actually fires on iOS Safari, where
    // beforeunload is unreliable. Both are idempotent, so firing twice is fine.
    window.addEventListener('pagehide', this.beforeUnloadHandler);
  }

  // ── loading ───────────────────────────────────────────────────────────────

  /**
   * Returns whichever of local and remote was written more recently.
   *
   * The previous version returned local unconditionally, which is why a PC
   * holding a stale blob would ignore newer state pushed from a phone. Both
   * sides now carry `savedAt`; when neither does (state written before this
   * change) the old local-wins behaviour is kept, since there is no basis to
   * prefer the remote copy.
   */
  async loadPriorState(deckId: string): Promise<StampedSessionState | undefined> {
    const local = this.readLocal(deckId);
    const remote = await this.readRemote(deckId);

    if (!remote) return local;
    if (!local) {
      this.writeLocal(deckId, remote);
      return remote;
    }

    const localAt = local.savedAt ?? 0;
    const remoteAt = remote.savedAt ?? 0;

    if (remoteAt > localAt) {
      this.writeLocal(deckId, remote);
      return remote;
    }
    return local;
  }

  /** The freshest state for a deck, for export. Does not touch local storage. */
  async snapshotFor(deckId: string): Promise<StampedSessionState | undefined> {
    const local = this.readLocal(deckId);
    const remote = await this.readRemote(deckId);
    if (!remote) return local;
    if (!local) return remote;
    return (remote.savedAt ?? 0) > (local.savedAt ?? 0) ? remote : local;
  }

  // ── saving ────────────────────────────────────────────────────────────────

  startSync(deckId: string, session: QuizSession, getCurrentIndex: () => number): void {
    this.stopSync();
    this.currentDeckId = deckId;
    this.currentSession = session;
    this.currentIndexFn = getCurrentIndex;

    this.syncSub = session.dirty$.pipe(
      filter(dirty => dirty),
      // debounce() re-reads the setting on every emission, so changing the
      // slider takes effect immediately. debounceTime() would have frozen
      // whatever value was current when startSync ran.
      debounce(() => timer(this.settings.sessionSyncDebounceMs())),
      tap(() => this.writeLocal(deckId, this.stamp(session, getCurrentIndex()))),
      switchMap(() => this.save(deckId, this.stamp(session, getCurrentIndex()))),
    ).subscribe({
      next: () => session.markClean(),
      error: err => console.error('SessionSync: auto-save failed', err),
    });
  }

  saveNow(deckId: string, session: QuizSession, currentIndex: number): void {
    const state = this.stamp(session, currentIndex);
    this.writeLocal(deckId, state);
    this.save(deckId, state).subscribe({
      next: () => session.markClean(),
      error: err => console.error('SessionSync: immediate save failed', err),
    });
  }

  /** Used by deck import to seed progress against a freshly created deck. */
  writeState(deckId: string, state: PersistedSessionState): Observable<unknown> {
    const stamped: StampedSessionState = {...state, savedAt: Date.now()};
    this.writeLocal(deckId, stamped);
    return this.save(deckId, stamped);
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

  clearSession(deckId: string): void {
    this.clearLocal(deckId);
    this.quizApi.updateCardStates(deckId, [{deckId, cardId: '_session', state: ''}])
      .subscribe({error: err => console.warn('SessionSync: remote clear failed', err)});
  }

  /** Drops every cached session blob. Called when the device adopts a new identity. */
  clearAllLocal(): void {
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

  private stamp(session: QuizSession, index: number): StampedSessionState {
    return {...session.serialize(index), savedAt: Date.now()};
  }

  /**
   * Closing the tab used to write local storage only, so the last few seconds
   * of a session never reached the server and the next device saw stale state.
   *
   * fetch(keepalive) rather than sendBeacon, because the request needs the
   * X-Session-Token header and sendBeacon cannot set one.
   */
  private saveOnUnload(): void {
    if (!this.currentDeckId || !this.currentSession || !this.currentIndexFn) return;

    const state = this.stamp(this.currentSession, this.currentIndexFn());
    this.writeLocal(this.currentDeckId, state);

    const token = this.profile.getToken();
    if (!token) return;

    try {
      fetch(`${environment.apiBaseUrl}/quizApi/decks/${this.currentDeckId}/state`, {
        method: 'POST',
        keepalive: true,
        headers: {'Content-Type': 'application/json', 'X-Session-Token': token},
        body: JSON.stringify([{
          deckId: this.currentDeckId,
          cardId: '_session',
          state: JSON.stringify(state),
        }]),
      });
    } catch {
      // Nothing useful to do during unload; the local copy is the fallback.
    }
  }

  private save(deckId: string, sessionState: StampedSessionState) {
    return this.quizApi.updateCardStates(deckId, [{
      deckId,
      cardId: '_session',
      state: JSON.stringify(sessionState),
    }]);
  }

  private async readRemote(deckId: string): Promise<StampedSessionState | undefined> {
    try {
      const states = await this.quizApi.getCardStates(deckId).toPromise();
      const first = states?.[0];
      if (!first?.state) return undefined;
      return JSON.parse(first.state) as StampedSessionState;
    } catch {
      console.warn(`SessionSync: could not read remote state for deck ${deckId}`);
      return undefined;
    }
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

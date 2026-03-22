import {Injectable, OnDestroy} from '@angular/core';
import {debounceTime, filter, Subscription, switchMap, tap} from 'rxjs';
import {QuizSession, PersistedSessionState} from './quiz-session';
import {QuizApiService} from '../../../../services/quiz-api.service';

@Injectable({
  providedIn: 'root'
})
export class SessionSyncService implements OnDestroy {
  private syncSub?: Subscription;
  private currentDeckId?: string;
  private currentSession?: QuizSession;
  private currentIndexFn?: () => number;

  private static readonly DEBOUNCE_MS = 5_000;
  private static readonly LOCAL_KEY_PREFIX = 'quiz_session_';

  private readonly beforeUnloadHandler = () => this.saveOnUnload();

  constructor(private quizApi: QuizApiService) {
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  async loadPriorState(deckId: string): Promise<PersistedSessionState | undefined> {
    // Fast path — localStorage
    const local = this.readLocal(deckId);
    if (local) return local;

    // Slow path — DB
    try {
      const states = await this.quizApi.getCardStates(deckId).toPromise();
      if (!states || states.length === 0) return undefined;


      const firstState = states[0];
      if (!firstState?.state) return undefined;

      const parsed = JSON.parse(firstState.state) as PersistedSessionState;

      // Backfill localStorage so subsequent F5s are instant
      this.writeLocal(deckId, parsed);

      return parsed;
    } catch {
      console.warn(`SessionSync: failed to load prior state for deck ${deckId}`);
      return undefined;
    }
  }

  startSync(
    deckId: string,
    session: QuizSession,
    getCurrentIndex: () => number,
  ): void {
    this.stopSync();
    this.currentDeckId = deckId;
    this.currentSession = session;
    this.currentIndexFn = getCurrentIndex;

    this.syncSub = session.dirty$.pipe(
      filter(dirty => dirty),
      debounceTime(SessionSyncService.DEBOUNCE_MS),
      tap(() => {
        // 5 s after last change — iterator is idle, index is correct
        this.writeLocal(deckId, session.serialize(getCurrentIndex()));
      }),
      switchMap(() => {
        const serialized = session.serialize(getCurrentIndex());
        return this.save(deckId, serialized);
      }),
    ).subscribe({
      next: () => session.markClean(),
      error: (err) => console.error('SessionSync: auto-save failed', err),
    });
  }

  saveNow(
    deckId: string,
    session: QuizSession,
    currentIndex: number,
  ): void {
    const serialized = session.serialize(currentIndex);
    this.writeLocal(deckId, serialized);
    this.save(deckId, serialized).subscribe({
      next: () => session.markClean(),
      error: (err) => console.error('SessionSync: immediate save failed', err),
    });
  }

  clearLocal(deckId: string): void {
    try {
      localStorage.removeItem(SessionSyncService.LOCAL_KEY_PREFIX + deckId);
    } catch {
      // Storage unavailable — no-op
    }
  }

  stopSync(): void {
    this.syncSub?.unsubscribe();
    this.syncSub = undefined;
    this.currentSession = undefined;
    this.currentIndexFn = undefined;
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    this.stopSync();
  }

  private saveOnUnload(): void {
    if (!this.currentDeckId || !this.currentSession || !this.currentIndexFn) return;

    const serialized = this.currentSession.serialize(this.currentIndexFn());
    this.writeLocal(this.currentDeckId, serialized);
  }

  private save(deckId: string, sessionState: PersistedSessionState) {
    const payload = [
      {
        deckId,
        cardId: '_session',
        state: JSON.stringify(sessionState),
      },
    ];
    return this.quizApi.updateCardStates(deckId, payload);
  }

  private writeLocal(deckId: string, state: PersistedSessionState): void {
    try {
      localStorage.setItem(
        SessionSyncService.LOCAL_KEY_PREFIX + deckId,
        JSON.stringify(state),
      );
    } catch {
      // Storage full or unavailable — DB sync is the fallback
    }
}

  private readLocal(deckId: string): PersistedSessionState | undefined {
    try {
      const raw = localStorage.getItem(SessionSyncService.LOCAL_KEY_PREFIX + deckId);
      if (!raw) return undefined;
      return JSON.parse(raw) as PersistedSessionState;
    } catch {
      return undefined;
    }
  }
}

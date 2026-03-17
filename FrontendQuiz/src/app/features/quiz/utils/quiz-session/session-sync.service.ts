import {Injectable, OnDestroy} from '@angular/core';
import {debounceTime, filter, Subscription, switchMap} from 'rxjs';
import {QuizSession, PersistedSessionState} from './quiz-session';
import {QuizApiService} from '../../../../services/quiz-api.service';

@Injectable({
  providedIn: 'root'
})
export class SessionSyncService implements OnDestroy {
  private syncSub?: Subscription;
  private currentDeckId?: string;

  private static readonly DEBOUNCE_MS = 5_000;

  constructor(private quizApi: QuizApiService) {}

  async loadPriorState(deckId: string): Promise<PersistedSessionState | undefined> {
    try {
      const states = await this.quizApi.getCardStates(deckId).toPromise();
      if (!states || states.length === 0) return undefined;


      const firstState = states[0];
      if (!firstState?.state) return undefined;

      return JSON.parse(firstState.state) as PersistedSessionState;
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

    this.syncSub = session.dirty$.pipe(
      filter(dirty => dirty),
      debounceTime(SessionSyncService.DEBOUNCE_MS),
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
    this.save(deckId, serialized).subscribe({
      next: () => session.markClean(),
      error: (err) => console.error('SessionSync: immediate save failed', err),
    });
  }

  stopSync(): void {
    this.syncSub?.unsubscribe();
    this.syncSub = undefined;
  }

  ngOnDestroy(): void {
    this.stopSync();
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
}

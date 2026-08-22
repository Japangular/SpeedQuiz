import {Injectable, OnDestroy, signal} from '@angular/core';

export type DeckLockStatus = 'owner' | 'follower' | 'unsupported';

@Injectable({providedIn: 'root'})
export class DeckLockService implements OnDestroy {
  readonly status = signal<DeckLockStatus>('unsupported');

  private releaseLock?: () => void;
  private deckId?: string;
  private channel = new BroadcastChannel('quiz-deck-lock');

  constructor() {
    this.channel.onmessage = ({data}) => {
      // Another tab wants this deck. Flush, then step aside.
      if (data?.type === 'takeover' && data.deckId === this.deckId && this.status() === 'owner') {
        this.onYield?.();               // QuizEngine hooks saveNow() here
        this.releaseLock?.();
        this.releaseLock = undefined;
        this.status.set('follower');
      }
    };
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.status() === 'follower' && this.deckId) void this.claim(this.deckId);
    });
  }

  /** Called before the owner gives up the lock — flush pending state. */
  onYield?: () => void;

  async claim(deckId: string): Promise<DeckLockStatus> {
    this.abandon();
    this.deckId = deckId;

    if (!('locks' in navigator)) { this.status.set('unsupported'); return 'unsupported'; }

    const got = await new Promise<boolean>(acquired => {
      navigator.locks.request(`quiz-session:${deckId}`, {ifAvailable: true}, lock => {
        if (!lock) { acquired(false); return; }
        acquired(true);
        // Hold the lock open until abandon() resolves this.
        return new Promise<void>(done => { this.releaseLock = done; });
      }).catch(() => acquired(false));
    });

    this.status.set(got ? 'owner' : 'follower');
    return this.status();
  }

  /** Follower asks the current owner to hand over, then re-claims. */
  async takeOver(): Promise<DeckLockStatus> {
    if (!this.deckId) return this.status();
    this.channel.postMessage({type: 'takeover', deckId: this.deckId});
    await new Promise(r => setTimeout(r, 150));   // let the owner flush + release
    return this.claim(this.deckId);
  }

  abandon(): void { this.releaseLock?.(); this.releaseLock = undefined; }
  ngOnDestroy(): void { this.abandon(); this.channel.close(); }
}

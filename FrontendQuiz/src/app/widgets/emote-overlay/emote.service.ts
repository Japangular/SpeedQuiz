import {inject, Injectable, OnDestroy, signal} from '@angular/core';
import {SiteModeService} from '../../site-mode/site-mode.service';

export type EmoteEvent = 'cardSwitch' | 'correct' | 'hint' | 'reset' | 'takingLong';

export interface EmoteDisplay {
  src: string;
  mode: 'flash' | 'linger';
  /** Changes every trigger so the overlay recreates the <img> and restarts the CSS animation. */
  key: number;
}

/**
 * Which image (under public/emotes/) each event shows.
 * Rename these to match your exported layer names.
 */
const EMOTE_MAP: Record<EmoteEvent, string> = {
  cardSwitch: 'emotes/waiting.png',
  correct:    'emotes/happy.png',
  hint:       'emotes/shocked.png',
  reset:      'emotes/shocked.png',
  takingLong: 'emotes/waiting.png',
};

/** Which events also play the ping. */
const PLAY_SOUND: Record<EmoteEvent, boolean> = {
  cardSwitch: true,
  correct:    true,
  hint:       false,
  reset:      false,
  takingLong: false,   // it creeps in silently — that's the joke
};

/** Keep in sync with the `emote-pop` animation duration in emote-overlay.component.css */
const FLASH_MS = 1600;
/** Idle time on a single card before the "taking long" emote fades in and stays. */
const TAKING_LONG_MS = 25_000;
/** A solved card immediately fires cardSwitch too — within this window, 'correct' wins. */
const SUPPRESS_CARD_SWITCH_MS = 500;

@Injectable({providedIn: 'root'})
export class EmoteService implements OnDestroy {

  /** The emote currently on screen (null = none). Read by EmoteOverlayComponent. */
  readonly current = signal<EmoteDisplay | null>(null);

  private hideTimer?: ReturnType<typeof setTimeout>;
  private longTimer?: ReturnType<typeof setTimeout>;
  private lastTriggerAt = 0;
  private key = 0;
  private audioCtx?: AudioContext;

  private siteMode = inject(SiteModeService);

  trigger(event: EmoteEvent): void {
    if (!this.siteMode.isVtuberFan) return;
    // onCardSolved() calls nextCard(), which makes card$ emit right after —
    // don't let the card-switch emote stomp on the 'correct' emote.
    if (event === 'cardSwitch' && Date.now() - this.lastTriggerAt < SUPPRESS_CARD_SWITCH_MS) {
      this.armTakingLongTimer();
      return;
    }
    this.lastTriggerAt = Date.now();

    const mode = event === 'takingLong' ? 'linger' as const : 'flash' as const;
    this.show(EMOTE_MAP[event], mode);

    if (PLAY_SOUND[event]) this.playPing();
    if (event !== 'takingLong') this.armTakingLongTimer();
  }

  /** Hide everything and cancel timers (e.g. when leaving the quiz route). */
  clear(): void {
    clearTimeout(this.hideTimer);
    clearTimeout(this.longTimer);
    this.current.set(null);
  }

  ngOnDestroy(): void {
    this.clear();
    void this.audioCtx?.close();
  }

  // ---------------------------------------------------------------- internals

  private show(src: string, mode: 'flash' | 'linger'): void {
    clearTimeout(this.hideTimer);
    this.current.set({src, mode, key: ++this.key});
    if (mode === 'flash') {
      this.hideTimer = setTimeout(() => this.current.set(null), FLASH_MS);
    }
    // 'linger' stays until the next trigger() or clear().
  }

  private armTakingLongTimer(): void {
    clearTimeout(this.longTimer);
    this.longTimer = setTimeout(() => this.trigger('takingLong'), TAKING_LONG_MS);
  }

  /**
   * Short synthesized "ping" via the Web Audio API — no sound file needed.
   * Browsers only allow audio after the user has interacted with the page;
   * since you're typing answers, that's effectively always true. Failures
   * are swallowed so the emote still shows.
   *
   * Prefer a real sound file? Put ping.mp3 in public/emotes/ and replace the
   * body with:
   *   const a = new Audio('emotes/ping.mp3');
   *   a.volume = 0.4;
   *   void a.play().catch(() => {});
   */
  private playPing(): void {
    try {
      this.audioCtx ??= new AudioContext();
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') void ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* audio blocked or unsupported — no big deal */ }
  }
}

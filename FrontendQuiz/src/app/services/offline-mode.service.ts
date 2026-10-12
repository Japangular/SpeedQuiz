import {computed, Injectable, signal} from '@angular/core';
import {Observable, Subject} from 'rxjs';

@Injectable({providedIn: 'root'})
export class OfflineModeService {
  private static readonly KEY = 'japangular_offline_mode';

  private browserOnline = signal(navigator.onLine);
  readonly forced = signal(localStorage.getItem(OfflineModeService.KEY) === '1');

  /** Either the user asked for it, or the browser lost the connection. */
  readonly offline = computed(() => this.forced() || !this.browserOnline());

  private readonly reconnectedSubject = new Subject<void>();

  /**
   * Fires when the app may use the network again: the connection came back,
   * or offline mode was switched off while online. Saves that failed in
   * between are retried on it.
   */
  readonly reconnected$: Observable<void> = this.reconnectedSubject.asObservable();

  constructor() {
    window.addEventListener('online', () => this.update(() => this.browserOnline.set(true)));
    window.addEventListener('offline', () => this.update(() => this.browserOnline.set(false)));
  }

  setForced(on: boolean): void {
    this.update(() => this.forced.set(on));
    localStorage.setItem(OfflineModeService.KEY, on ? '1' : '0');
  }

  /** Applies a change, and announces it when it ended an offline stretch. */
  private update(change: () => void): void {
    const wasOffline = this.offline();
    change();
    if (wasOffline && !this.offline()) this.reconnectedSubject.next();
  }
}

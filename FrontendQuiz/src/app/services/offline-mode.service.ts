import {computed, Injectable, signal} from '@angular/core';

@Injectable({providedIn: 'root'})
export class OfflineModeService {
  private static readonly KEY = 'japangular_offline_mode';

  private browserOnline = signal(navigator.onLine);
  readonly forced = signal(localStorage.getItem(OfflineModeService.KEY) === '1');

  /** Either the user asked for it, or the browser lost the connection. */
  readonly offline = computed(() => this.forced() || !this.browserOnline());

  constructor() {
    window.addEventListener('online', () => this.browserOnline.set(true));
    window.addEventListener('offline', () => this.browserOnline.set(false));
  }

  setForced(on: boolean): void {
    this.forced.set(on);
    localStorage.setItem(OfflineModeService.KEY, on ? '1' : '0');
  }
}

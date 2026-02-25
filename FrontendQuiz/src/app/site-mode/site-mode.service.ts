import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Router} from '@angular/router';

export type SiteMode = 'vtuberfan' | 'portfolio' | null;

const VALID_TOKENS: Record<string, SiteMode> = {'vtuberfan': 'vtuberfan', 'portfolio': 'portfolio'};

const MODE_STORAGE_KEY = 'japangular_site_mode';

@Injectable({
  providedIn: 'root'
})
export class SiteModeService {

  private modeSubject = new BehaviorSubject<SiteMode>(this.loadFromStorage());
  mode$ = this.modeSubject.asObservable();

  constructor(private router: Router) { }

  initialize(): void {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token && VALID_TOKENS[token]) {
      const mode = VALID_TOKENS[token];
      this.setMode(mode);

      // Clean the URL: remove ?token=... without a full page reload
      params.delete('token');
      const cleanPath = window.location.pathname
        + (params.toString() ? '?' + params.toString() : '')
        + window.location.hash;
      window.history.replaceState({}, '', cleanPath);
    }
  }

  get mode(): SiteMode {
    return this.modeSubject.value;
  }

  get isVtuberFan(): boolean {
    return this.modeSubject.value === 'vtuberfan';
  }

  get isPortfolio(): boolean {
    return this.modeSubject.value === 'portfolio';
  }

  get hasAccess(): boolean {
    return this.modeSubject.value !== null;
  }

  private setMode(mode: SiteMode): void {
    localStorage.setItem(MODE_STORAGE_KEY, mode ?? '');
    this.modeSubject.next(mode);
  }

  private loadFromStorage(): SiteMode {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored && VALID_TOKENS[stored]) {
      return VALID_TOKENS[stored];
    }
    return null;
  }
}

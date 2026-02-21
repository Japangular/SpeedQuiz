import { Injectable } from '@angular/core';

export interface ExtractCardState {
  chosenProvider: string;
  stepIndex: number;
  connectionStatus?: {username: string;}
  payload?: any;
}

const TOKEN_HASH_STORAGE_KEY = 'wk_token_cache';

export interface StoredTokenCache {
  claimedName: string;
  tokenHash: string;
  provider: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExtractCardStateService {
  private state: ExtractCardState | null = null;

  save(state: ExtractCardState) {
    this.state = state;
  }

  restore(): ExtractCardState | null {
    return this.state;
  }

  clear(): void {
    this.state = null;
  }

  // ── localStorage token hash methods ──

  saveTokenHash(cache: StoredTokenCache): void {
    localStorage.setItem(TOKEN_HASH_STORAGE_KEY, JSON.stringify(cache));
}

  loadTokenHash(): StoredTokenCache | null {
    const raw = localStorage.getItem(TOKEN_HASH_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredTokenCache;
    } catch {
      return null;
    }
  }

  clearTokenHash(): void {
    localStorage.removeItem(TOKEN_HASH_STORAGE_KEY);
  }
}

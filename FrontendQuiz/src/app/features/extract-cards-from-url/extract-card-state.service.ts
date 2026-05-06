import { Injectable } from '@angular/core';

export interface ExtractCardState {
  chosenProvider: string;
  stepIndex: number;
  connectionStatus?: {username: string;}
  payload?: any;
}

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
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeckShelfService {
  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) { }

  getDeckOverview(username: string, wkClaimedName?: string, wkTokenHash?: string): Observable<DeckInfo[]> {
    let params: any = {username};
    if (wkClaimedName) params.wkClaimedName = wkClaimedName;
    if (wkTokenHash) params.wkTokenHash = wkTokenHash;

    return this.http.get<DeckInfo[]>(`${this.apiUrl}/quizApi/decks`, {params});
  }

  loadDeck(deckId: string, username: string): Observable<SubmissionDeck> {
    return this.http.get<SubmissionDeck>(`${this.apiUrl}/quizApi/decks/${deckId}`, {
      params: { username }
    });
  }
}

export interface DeckInfo {
  id: string;
  name: string;
  description: string;
  attribution: string;
}

export interface SubmissionDeck {
  deckName: string;
  username: string;
  properties: Record<string, string>;
  cards: Record<string, string>[];
}

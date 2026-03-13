import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {DeckInfo, DeckService} from '../../../generated/api';
import {SubmissionDeck} from '../../../generated/api/model/submissionDeck';

@Injectable({
  providedIn: 'root'
})
export class DeckShelfService {
  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient, private deckApi: DeckService) { }

  getDeckOverview(ownerId: string, wkClaimedName?: string, wkTokenHash?: string): Observable<DeckInfo[]> {
    let params: any = { ownerId };
    if (wkClaimedName) params.wkClaimedName = wkClaimedName;
    if (wkTokenHash) params.wkTokenHash = wkTokenHash;

    return this.http.get<DeckInfo[]>(`${this.apiUrl}/quizApi/decks`, { params });
  }

  loadDeck(deckId: string, ownerId: string): Observable<SubmissionDeck> {
    return this.http.get<SubmissionDeck>(`${this.apiUrl}/quizApi/decks/${deckId}`, {
      params: { ownerId }
    });
  }
}

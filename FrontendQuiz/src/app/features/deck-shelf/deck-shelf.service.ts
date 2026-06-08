import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {DeckContent, DeckInfo, DeckService} from '../../../generated/api';

@Injectable({
  providedIn: 'root'
})
export class DeckShelfService {
  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient, private deckApi: DeckService) { }

  getDeckOverview(): Observable<DeckInfo[]> {
    return this.http.get<DeckInfo[]>(`${this.apiUrl}/quizApi/decks`);
  }

  loadDeck(deckId: string): Observable<DeckContent> {
    return this.http.get<DeckContent>(`${this.apiUrl}/quizApi/decks/${deckId}`);
  }

  deleteDeck(deckId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/quizApi/decks/${deckId}`);
  }
}

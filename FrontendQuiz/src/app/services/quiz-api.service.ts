import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../environments/environment';
import {DeckInfo, DeckContent, DeckPage, DeckCardState} from '../models/deck.model';
import {QuizApi} from '../interfaces/quiz-api';
import {LocalProfileService} from '../user-store-management/local-profile.service';

@Injectable({providedIn: 'root'})
export class QuizApiService implements QuizApi {
  private apiUrl = `${environment.apiBaseUrl}/quizApi/decks`;

  constructor(
    private http: HttpClient,
  ) {}

  listDecks(): Observable<DeckInfo[]> {
    return this.http.get<DeckInfo[]>(this.apiUrl);
  }

  loadDeck(deckId: string): Observable<DeckContent> {
    return this.http.get<DeckContent>(`${this.apiUrl}/${deckId}`);
  }

  browseDeck(deckId: string, limit = 100, offset = 0, filter?: string): Observable<DeckPage> {
    let params = new HttpParams().set('limit', limit.toString()).set('offset', offset.toString());
    if (filter) params = params.set('filter', filter);
    return this.http.get<DeckPage>(`${this.apiUrl}/${deckId}/page`, {params});
  }

  createDeck(deckName: string, content: DeckContent): Observable<any> {
    const params = new HttpParams().set('deckName', deckName);
    return this.http.post(this.apiUrl, content, {params});
  }

  getCardStates(deckId: string): Observable<DeckCardState[]> {
    return this.http.get<DeckCardState[]>(`${this.apiUrl}/${deckId}/state`);
  }

  updateCardStates(deckId: string, states: DeckCardState[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${deckId}/state`, states);
  }
}

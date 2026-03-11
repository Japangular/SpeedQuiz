import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../environments/environment';
import {DeckInfo, DeckContent, DeckPage, DeckCardState} from '../models/deck.model';
import {QuizApi} from '../interfaces/SubmissionDeckApi';

@Injectable({providedIn: 'root'})
export class QuizApiService implements QuizApi {
  private apiUrl = `${environment.apiBaseUrl}/quizApi/decks`;
  private ownerId = crypto.randomUUID(); // temporary

  constructor(private http: HttpClient) {
  }

  listDecks(): Observable<DeckInfo[]> {
    const params = new HttpParams().set('ownerId', this.ownerId);
    return this.http.get<DeckInfo[]>(this.apiUrl, {params});
  }

  loadDeck(deckId: string): Observable<DeckContent> {
    const params = new HttpParams().set('ownerId', this.ownerId);
    return this.http.get<DeckContent>(`${this.apiUrl}/${deckId}`, {params});
  }

  browseDeck(deckId: string, limit = 100, offset = 0, filter?: string): Observable<DeckPage> {
    let params = new HttpParams()
      .set('ownerId', this.ownerId)
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    if (filter) params = params.set('filter', filter);
    return this.http.get<DeckPage>(`${this.apiUrl}/${deckId}/page`, {params});
  }

  createDeck(deckName: string, content: DeckContent): Observable<any> {
    const params = new HttpParams()
      .set('ownerId', this.ownerId)
      .set('deckName', deckName);
    return this.http.post(this.apiUrl, content, {params});
  }

  getCardStates(deckId: string): Observable<DeckCardState[]> {
    const params = new HttpParams().set('ownerId', this.ownerId);
    return this.http.get<DeckCardState[]>(`${this.apiUrl}/${deckId}/state`, {params});
  }

  updateCardStates(deckId: string, states: DeckCardState[]): Observable<any> {
    const params = new HttpParams().set('ownerId', this.ownerId);
    return this.http.post(`${this.apiUrl}/${deckId}/state`, states, {params});
  }
}

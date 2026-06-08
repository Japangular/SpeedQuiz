import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {AnkiPage, AnkiPageInfo, UserTableStates} from './anki-table.model';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs';
import {AnkiSourceService} from './anki-source.service';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BackendSourceService extends AnkiSourceService {
  private apiUrl = `${environment.apiBaseUrl}`;
  private deckId = 'anki-local';

  constructor(private http: HttpClient) {
    super();
  }

  getPage(limit = 10, offset = 0, questionFilter = ""): Observable<AnkiPage> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
      .set('filter', questionFilter);   // ownerId removed
    return this.http.get<DeckPage>(`${this.apiUrl}/quizApi/decks/${this.deckId}/page`, {params})
      .pipe(map(deckPage => this.toAnkiPage(deckPage)));
  }

  getTotal(): Observable<AnkiPageInfo> {
    return this.getPage(1, 0).pipe(
      map(page => page.info)
    );
  }

  persistIgnoredAnkiRows(rowIds: string[]): Observable<string> {
    const states = rowIds.map(id => ({deckId: this.deckId, cardId: id, state: 'ignored'}));
    return this.http.post(`${this.apiUrl}/quizApi/decks/${this.deckId}/state`, states)
      .pipe(map(() => `Persisted ${rowIds.length} rows.`));
  }

  getIgnoredAnkiRows(): Observable<UserTableStates> {
    return this.http.get<DeckCardState[]>(`${this.apiUrl}/quizApi/decks/${this.deckId}/state`)
      .pipe(map(states => ({rowIds: states.map(s => s.cardId), deckname: this.deckId})));
  }

  private toAnkiPage(deckPage: DeckPage): AnkiPage {
    return {
      data: deckPage.cards.map((card, index) => ({
        index: (deckPage.offset + index + 1).toString(),
        question: card['question'] || '',
        reading: card['reading'] || '',
        meaning: card['meaning'] || ''
      })),
      info: {
        totalAvailableRows: deckPage.totalCards,
        columnNames: ['index', 'Question', 'Reading', 'Meaning']
      }
    };
  }
}

interface DeckPage {
  cards: Record<string, string>[];
  totalCards: number;
  offset: number;
  limit: number;
}

interface DeckCardState {
  deckId: string;
  cardId: string;
  state: string;
}

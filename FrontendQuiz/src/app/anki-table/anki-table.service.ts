import { Injectable } from '@angular/core';
import {environment} from '../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AnkiCard, AnkiPage, AnkiPageInfo} from './anki-table.model';
import {PropertyType} from '../features/dynamic-card-creator/submission-deck.model';
import {SubmissionDeck} from '../../generated/api';
import {DeckIterator} from '../quiz/utils/deck-iterator/DeckIterator';
import {CardStoreService} from '../services/card-store.service';

@Injectable({
  providedIn: 'root'
})
export class AnkiTableService {

  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient, private cardStoreService: CardStoreService) {
  }

  getPage(limit: number = 10, offset: number = 0): Observable<AnkiPage> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<AnkiPage>(`${this.apiUrl}/anki/questionReadingMeaning`, {params});
  }

  getTotal(): Observable<AnkiPageInfo> {
    return this.http.get<AnkiPageInfo>(`${this.apiUrl}/anki/tableInformation`);
  }

  learnSelected(ankiCards: AnkiCard[]){
    if(!ankiCards || ankiCards.length == 0)
      return;

    const cards = ankiCards.map(card => ({
      index: card.index,
      question: card.question,
      reading: card.reading,
      meaning: card.meaning
    }));
    const deck = {
      deckName: "SelectedAnkiDeck",
      username: "ankiUser",
      properties: {index: PropertyType.UNKNOWN, question: PropertyType.QUESTION, reading: PropertyType.ANSWER, meaning: PropertyType.ANSWER},
      cards: cards,
    } as SubmissionDeck;

    this.cardStoreService.setCurrentDeck(deck);

  }
}

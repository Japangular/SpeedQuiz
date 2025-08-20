import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AnkiCard, AnkiPage, AnkiPageInfo} from './anki-table.model';
import {environment} from '../../environments/environment';
import {CardStoreService} from '../../services/card-store.service';
import {PropertyType, SubmissionDeck} from '../../../generated/api';

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
      meaning: card.meaning,
      hint: [card.index, card.question, card.reading, card.meaning].join(" : "),
    }));
    const deck = {
      deckName: "SelectedAnkiDeck",
      username: "ankiUser",
      properties: {index: PropertyType.Info, question: PropertyType.Question, reading: PropertyType.Answer, meaning: PropertyType.Answer, hint: PropertyType.Hint},
      cards: cards,
    } as SubmissionDeck;

    this.cardStoreService.setCurrentDeck(deck);

  }

  deleteSelectedRows(ankiCards: AnkiCard[]){

  }
}

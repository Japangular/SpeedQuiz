import { Injectable } from '@angular/core';
import {AnkiSourceService} from './anki-source.service';
import {Observable, of} from "rxjs";
import {AnkiCard, AnkiPage, AnkiPageInfo, UserTableStates} from "./anki-table.model";

@Injectable({
  providedIn: 'root'
})
export class JsonSourceService extends AnkiSourceService {
  private cards: AnkiCard[] = [];
  private ignoredCards: AnkiCard[] = [];
  private usedCards: AnkiCard[] = [];

  constructor() {
    super();
  }

  setCards(cards: AnkiCard[]) {
    this.cards = cards;
    this.usedCards = cards;
  }

  override getPage(limit: number, offset: number, questionFilter: string): Observable<AnkiPage> {
      let filtered = this.usedCards;

      if(questionFilter) {
        const filterTerm = questionFilter.toLowerCase().trim();
        filtered = filtered.filter(card => card.question.toLowerCase().includes(filterTerm));
      }

      const slice = filtered.slice(offset, offset + limit);

    return of({
      data: slice,
      info: {
        totalAvailableRows: filtered.length,
        columnNames: ['index', 'question', 'reading', 'meaning']
      }
    });
  }
  override getTotal(): Observable<AnkiPageInfo> {
    return of({
      totalAvailableRows: this.cards.length,
      columnNames: ['index', 'question', 'reading', 'meaning']
    });
  }
  override persistIgnoredAnkiRows(rowIds: string[]): Observable<string> {
    this.ignoredCards = this.cards.filter(card => rowIds.includes(card.index));
    this.usedCards = this.cards.filter(card => !rowIds.includes(card.index));

    return of('ok');
  }
  override getIgnoredAnkiRows(): Observable<UserTableStates> {
   return of({deckname: "ExtractedCardsFromUrl", rowIds: this.ignoredCards.map(card => card.index)});
  }
}

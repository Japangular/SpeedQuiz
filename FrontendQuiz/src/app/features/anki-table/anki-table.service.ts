import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AnkiCard, AnkiPage, AnkiPageInfo} from './anki-table.model';
import {environment} from '../../environments/environment';
import {QuizBoardService} from '../quiz/quiz-board/quiz-board.service';

@Injectable({
  providedIn: 'root'
})
export class AnkiTableService {

  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient, private quizBoardService: QuizBoardService) {
  }

  getPage(limit: number = 10, offset: number = 0, questionFilter = ""): Observable<AnkiPage> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
      .set('questionFilter', questionFilter.toString())
    ;

    return this.http.get<AnkiPage>(`${this.apiUrl}/anki/questionReadingMeaning`, {params});
  }

  getTotal(): Observable<AnkiPageInfo> {
    return this.http.get<AnkiPageInfo>(`${this.apiUrl}/anki/tableInformation`);
  }

  learnSelected(ankiCards: AnkiCard[]){
    if (!ankiCards || ankiCards.length == 0)
      return;
    this.quizBoardService.learnSelected(ankiCards);
  }

  persistIgnoredAnkiRows(rowIds: string[]): Observable<string>{
    console.log(rowIds);
    return this.http.post<string>(`${this.apiUrl}/anki/persistIgnoredAnkiRows`, {deckname: DEV_DECK_NAME, rowIds: rowIds});
  }

  getIgnoredAnkiRows(): Observable<UserTableStates> {
    return this.http.get<UserTableStates>(`${this.apiUrl}/anki/getIgnoredAnkiRows`);
  }

  applyQuestionFilter(charOrWord: string) {

  }
}

export const DEV_DECK_NAME = "dev_ignored_anki_rows";

export interface UserTableStates {
  deckname: string;
  rowIds: string[];
}

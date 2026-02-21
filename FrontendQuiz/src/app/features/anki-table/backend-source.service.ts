import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {AnkiPage, AnkiPageInfo, DEV_DECK_NAME, UserTableStates} from './anki-table.model';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs';
import {AnkiSourceService} from './anki-source.service';

@Injectable({
  providedIn: 'root'
})
export class BackendSourceService extends AnkiSourceService{
  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {
    super();
  }

  getPage(limit: number = 10, offset: number = 0, questionFilter = ""): Observable<AnkiPage> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
      .set('questionFilter', questionFilter.toString())
    ;

    return this.http.get<AnkiPage>(`${this.apiUrl}/anki/questionReadingMeaning`, {params})
  }

  getTotal(): Observable<AnkiPageInfo> {
    return this.http.get<AnkiPageInfo>(`${this.apiUrl}/anki/tableInformation`);
  }

  persistIgnoredAnkiRows(rowIds: string[]): Observable<string> {
    console.log(rowIds);
    return this.http.post<string>(`${this.apiUrl}/anki/persistIgnoredAnkiRows`, {deckname: DEV_DECK_NAME, rowIds: rowIds});
  }

  getIgnoredAnkiRows(): Observable<UserTableStates> {
    return this.http.get<UserTableStates>(`${this.apiUrl}/anki/getIgnoredAnkiRows`);
  }
}

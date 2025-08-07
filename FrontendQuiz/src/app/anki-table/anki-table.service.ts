import { Injectable } from '@angular/core';
import {environment} from '../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AnkiPage, AnkiPageInfo} from './anki-table.model';

@Injectable({
  providedIn: 'root'
})
export class AnkiTableService {

  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {
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
}

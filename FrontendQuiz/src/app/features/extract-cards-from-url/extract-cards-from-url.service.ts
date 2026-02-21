import { Injectable } from '@angular/core';
import {Observable, of} from 'rxjs';
import {ImportedCard} from './extract-cards-from-url.component';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExtractCardsFromUrlService {
  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) { }

  testConnection(cardsFromUrlModel: CardsFromUrlModel): Observable<CardsFromUrlModel> {
    return this.http.post<CardsFromUrlModel>(`${this.apiUrl}/cardsFromUrl/setUpConnection`, cardsFromUrlModel);
  }

  fetchHomework(cardsFromUrlModel: CardsFromUrlModel): Observable<any> {
    return of(true);
  }

  commitCards(previewCards: ImportedCard[]): Observable<any> {
    return of(true);
  }
}

export interface CardsFromUrlModel {
  provider: String;
  claimedName: string;
  apiToken: string;
  tokenHash?: string;

  connectionTested?: boolean;
  connectionFailed?: boolean;
  connectedUser?: string;

  payload?: any;
}

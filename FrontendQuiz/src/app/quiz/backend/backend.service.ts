import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Card} from '../libquiz/quiz/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  public static API_BASE_URL = 'http://localhost:8088/quiz';

  constructor(private http: HttpClient) {
  }

  getCard(): Observable<Card> {
    return this.http.get<Card>(`${BackendService.API_BASE_URL}/card`);
  }

  nextCard(): Observable<void> {
    return this.http.post<void>(`${BackendService.API_BASE_URL}/next`, {});
  }

  useHint(): Observable<void> {
    return this.http.post<void>(`${BackendService.API_BASE_URL}/hint`, {});
  }

  setAsStartPoint(): Observable<void>{
    return this.http.post<void>(`${BackendService.API_BASE_URL}/setAsStartPoint`, {});
  }

  toggleCardType(cardType?: string): Observable<void> {
    const params = cardType ? {cardType} : {}; // If cardType is provided, include it in the request body
    return this.http.post<void>(`${BackendService.API_BASE_URL}/toggleCardType`, params);
  }

  jumpTo(jumpKey: string): Observable<void>{
    return this.http.post<void>(`${BackendService.API_BASE_URL}/jumpTo`, jumpKey);
  }
}

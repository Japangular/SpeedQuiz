import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Entry, KanjiDTO, WordFeature} from './japanese-dict.model';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JapaneseDictService {
  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {
  }

  searchKanji(term: string): Observable<KanjiDTO[]> {
    const params = new HttpParams().set('k', term);
    return this.http.get<KanjiDTO[]>(this.apiUrl+"/kanjiDict/search", {params});
  }

  jouyouKanjis(): Observable<KanjiDTO[]> {
    return this.http.get<KanjiDTO[]>(this.apiUrl+"/kanjiDict/jouyou");
  }

  searchEntries(term: string): Observable<Entry[]> {
    const params = new HttpParams().set('q', term);
    return this.http.get<Entry[]>(this.apiUrl + "/kanjiDict/search", {params});
  }

  searchMecab(term: string): Observable<WordFeature[]> {
    const params = new HttpParams().set('k', term);
    return this.http.get<WordFeature[]>(this.apiUrl + "/kanjiDict/parseMecab", {params});
  }
}





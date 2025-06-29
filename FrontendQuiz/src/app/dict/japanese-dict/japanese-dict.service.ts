import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JapaneseDictService {
  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {
  }

  searchKanji(term: string): Observable<Kanji> {
    const params = new HttpParams().set('k', term);
    return this.http.get<Kanji>(this.apiUrl+"/kanjiDict/search", {params});
  }

  searchEntries(term: string): Observable<Entry[]> {
    const params = new HttpParams().set('q', term);
    return this.http.get<Entry[]>(this.apiUrl + "/kanjiDict/search", {params});
  }
}

export interface Kanji {
  id: number;
  kanji: string;
  onyomi: string[];
  kunyomi: string[];
  meanings: string[];
  tags: string[];
  metadata: { [key: string]: any };
}

export interface KanjiQuizData {
  kanji: string;
  onyomi: string[];
  kunyomi: string[];
  meanings: string[];
}

export function mapKanjiToQuizData(kanji: Kanji): KanjiQuizData {
  const {id, tags, metadata, ...quizData} = kanji;
  return quizData;
}

export interface Entry {
  entSeq: number;
  kEle: KElement[];
  rEle: RElement[];
  sense: Sense[];
}

export interface KElement {
  keb: string;
  keInf: string[];
  kePri: string[];
}

export interface RElement {
  reb: string;
  reInf: string[];
  rePri: string[];
}

export interface Sense {
  pos: string[];
  xref: string[];
  ant: string[];
  field: string[];
  misc: string[];
  sInf: string[];
  lsource: LSource[];
  dial: string[];
  gloss: string[];
}

export interface LSource {
  value: string;
  lang: string;
  lsType: string;
  wasei: string;
}


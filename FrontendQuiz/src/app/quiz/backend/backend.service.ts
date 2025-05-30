import { Injectable } from '@angular/core';
import {Observable, of} from 'rxjs';
import {Card} from '../dualInputCard/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  public static API_BASE_URL = 'OUTDATED_URL';

  private http = new MockHttpClient();

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
    const params = cardType ? {cardType} : {};
    return this.http.post<void>(`${BackendService.API_BASE_URL}/toggleCardType`, params);
  }

  jumpTo(jumpKey: string): Observable<void>{
    return this.http.post<void>(`${BackendService.API_BASE_URL}/jumpTo`, jumpKey);
  }
}

@Injectable()
export class MockHttpClient {
  private cards = [
    {
      index: 0,
      level: 1,
      subjectType: 'vocab',
      question: '火',
      reading: 'ひ',
      meaning: 'fire',
      info: 'Represents fire or flame.',
      hint: 'Think of a campfire.',
      subjectId: 1001
    },
    {
      index: 1,
      level: 1,
      subjectType: 'vocab',
      question: '水',
      reading: 'みず',
      meaning: 'water',
      info: 'Used in words like 水曜日 (Wednesday).',
      hint: 'Looks like flowing water.',
      subjectId: 1002
    },
    {
      index: 2,
      level: 1,
      subjectType: 'vocab',
      question: '土',
      reading: 'つち',
      meaning: 'earth, soil',
      info: 'Represents ground or dirt.',
      hint: 'Used in 土曜日 (Saturday).',
      subjectId: 1003
    },
    {
      index: 3,
      level: 1,
      subjectType: 'vocab',
      question: '風',
      reading: 'かぜ',
      meaning: 'wind',
      info: 'Can also mean "cold" depending on context.',
      hint: 'Think of breezy air.',
      subjectId: 1004
    },
    {
      index: 4,
      level: 1,
      subjectType: 'vocab',
      question: '空',
      reading: 'そら',
      meaning: 'sky, empty',
      info: 'Also means "empty" depending on kanji reading.',
      hint: 'Sky with nothing in it.',
      subjectId: 1005
    },
    {
      index: 5,
      level: 1,
      subjectType: 'vocab',
      question: '木',
      reading: 'き',
      meaning: 'tree, wood',
      info: 'Used in 木曜日 (Thursday).',
      hint: 'Looks like a tree with branches.',
      subjectId: 1006
    },
    {
      index: 6,
      level: 1,
      subjectType: 'vocab',
      question: '金',
      reading: 'きん',
      meaning: 'gold, money',
      info: 'Used in 金曜日 (Friday).',
      hint: 'Think of shiny metal.',
      subjectId: 1007
    },
    {
      index: 7,
      level: 1,
      subjectType: 'vocab',
      question: '山',
      reading: 'やま',
      meaning: 'mountain',
      info: 'Shape resembles mountain peaks.',
      hint: 'Used in 富士山 (Mount Fuji).',
      subjectId: 1008
    },
    {
      index: 8,
      level: 1,
      subjectType: 'vocab',
      question: '川',
      reading: 'かわ',
      meaning: 'river',
      info: 'Symbolizes a flowing river.',
      hint: 'Looks like three river lines.',
      subjectId: 1009
    },
    {
      index: 9,
      level: 1,
      subjectType: 'vocab',
      question: '雨',
      reading: 'あめ',
      meaning: 'rain',
      info: 'Used in 雨天 (rainy weather).',
      hint: 'Raindrops falling from a cloud.',
      subjectId: 1010
    }
  ];

  private currentIndex = 0;

  get<T>(url: string) {
    const card = this.cards[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.cards.length;
    return of(card as unknown as T);
  }

  post<T>(url: string, body: any) {
    return of(undefined as unknown as T);
  }
}

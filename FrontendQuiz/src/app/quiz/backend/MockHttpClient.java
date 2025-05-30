import { of } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
export class MockHttpClient {
  get<T>() {
    const mockCard = {
      index: 0,
      level: 1,
      subjectType: 'vocab',
      question: '火',
      reading: 'ひ',
      meaning: 'fire',
      info: '',
      hint: '',
      subjectId: 1
    };
    return of(mockCard as unknown as T);
  }

  post<T>() {
    return of(undefined as unknown as T);
  }
}

import {TestBed} from '@angular/core/testing';

import {QuizEngine} from './quiz-engine.service';

describe('MainService', () => {
  let service: QuizEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuizEngine);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

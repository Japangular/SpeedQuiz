import { TestBed } from '@angular/core/testing';

import { QuizBoardService } from './quiz-board.service';

describe('MainService', () => {
  let service: QuizBoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuizBoardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

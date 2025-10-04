import {TestBed} from '@angular/core/testing';

import {QuizBackendApiService} from './quiz-backend-api.service';

describe('QuizBackendApiService', () => {
  let service: QuizBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuizBackendApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

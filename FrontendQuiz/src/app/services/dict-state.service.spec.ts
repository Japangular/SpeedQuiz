import { TestBed } from '@angular/core/testing';

import { DictStateService } from './dict-state.service';

describe('DictStateService', () => {
  let service: DictStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DictStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

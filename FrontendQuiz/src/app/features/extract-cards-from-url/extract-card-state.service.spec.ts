import { TestBed } from '@angular/core/testing';

import { ExtractCardStateService } from './extract-card-state.service';

describe('ExtractCardStateService', () => {
  let service: ExtractCardStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExtractCardStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

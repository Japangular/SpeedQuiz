import {TestBed} from '@angular/core/testing';

import {DeckPropertyService} from './deck-property.service';

describe('DeckPropertyService', () => {
  let service: DeckPropertyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeckPropertyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { DeckShelfService } from './deck-shelf.service';

describe('DeckShelfService', () => {
  let service: DeckShelfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeckShelfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

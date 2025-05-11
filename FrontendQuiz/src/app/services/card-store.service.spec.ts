import { TestBed } from '@angular/core/testing';

import { CardStoreService } from './card-store.service';

describe('CardStoreService', () => {
  let service: CardStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CardStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

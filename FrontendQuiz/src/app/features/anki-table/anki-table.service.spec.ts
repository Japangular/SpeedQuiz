import {TestBed} from '@angular/core/testing';

import {AnkiTableService} from './anki-table.service';

describe('AnkiTableService', () => {
  let service: AnkiTableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnkiTableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { AnkiSourceService } from './anki-source.service';

describe('AnkiSourceService', () => {
  let service: AnkiSourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnkiSourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { JsonSourceService } from './json-source.service';

describe('JsonSourceService', () => {
  let service: JsonSourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonSourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

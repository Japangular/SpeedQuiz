import { TestBed } from '@angular/core/testing';

import { BackendSourceService } from './backend-source.service';

describe('BackendSourceService', () => {
  let service: BackendSourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BackendSourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { SiteModeService } from './site-mode.service';

describe('SiteModeService', () => {
  let service: SiteModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SiteModeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

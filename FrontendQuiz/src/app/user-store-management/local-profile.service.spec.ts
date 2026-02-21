import { TestBed } from '@angular/core/testing';

import { LocalProfileService } from './local-profile.service';

describe('LocalProfileService', () => {
  let service: LocalProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

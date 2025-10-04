import {TestBed} from '@angular/core/testing';

import {JapaneseDictService} from './japanese-dict.service';

describe('JapaneseDictService', () => {
  let service: JapaneseDictService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JapaneseDictService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { TranscriptionTranslationService } from './transcription-translation.service';

describe('TranscriptionTranslationService', () => {
  let service: TranscriptionTranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TranscriptionTranslationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

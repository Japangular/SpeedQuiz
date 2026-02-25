import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TranscriptionTranslationTableComponent} from './transcription-translation-table.component';

describe('TranscriptionTranslationTableComponent', () => {
  let component: TranscriptionTranslationTableComponent;
  let fixture: ComponentFixture<TranscriptionTranslationTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranscriptionTranslationTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TranscriptionTranslationTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

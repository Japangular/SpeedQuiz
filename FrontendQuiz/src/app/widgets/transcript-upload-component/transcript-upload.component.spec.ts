import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranscriptUploadComponentComponent } from './transcript-upload.component';

describe('TranscriptUploadComponentComponent', () => {
  let component: TranscriptUploadComponentComponent;
  let fixture: ComponentFixture<TranscriptUploadComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranscriptUploadComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TranscriptUploadComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

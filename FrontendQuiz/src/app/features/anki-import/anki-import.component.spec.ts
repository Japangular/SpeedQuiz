import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnkiImportComponent } from './anki-import.component';

describe('AnkiImportComponent', () => {
  let component: AnkiImportComponent;
  let fixture: ComponentFixture<AnkiImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnkiImportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnkiImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AnkiTableComponent} from './anki-table.component';

describe('AnkiTableComponent', () => {
  let component: AnkiTableComponent;
  let fixture: ComponentFixture<AnkiTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnkiTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnkiTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

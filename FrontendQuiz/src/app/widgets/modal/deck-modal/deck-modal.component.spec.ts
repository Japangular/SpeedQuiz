import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeckModalComponent } from './deck-modal.component';

describe('DeckModalComponent', () => {
  let component: DeckModalComponent;
  let fixture: ComponentFixture<DeckModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeckModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeckModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

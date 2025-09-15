import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeckCompletedModalComponent } from './deck-completed-modal.component';

describe('DeckCompletedComponent', () => {
  let component: DeckCompletedModalComponent;
  let fixture: ComponentFixture<DeckCompletedModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeckCompletedModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeckCompletedModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

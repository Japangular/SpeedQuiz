import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeckShelfComponent } from './deck-shelf.component';

describe('DeckShelfComponent', () => {
  let component: DeckShelfComponent;
  let fixture: ComponentFixture<DeckShelfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeckShelfComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeckShelfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

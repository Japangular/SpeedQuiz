import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DeckChooserComponent} from './deck-chooser.component';

describe('DeckChooserComponent', () => {
  let component: DeckChooserComponent;
  let fixture: ComponentFixture<DeckChooserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeckChooserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeckChooserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtractCardsFromUrlComponent } from './extract-cards-from-url.component';

describe('ExtractCardsFromUrlComponent', () => {
  let component: ExtractCardsFromUrlComponent;
  let fixture: ComponentFixture<ExtractCardsFromUrlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtractCardsFromUrlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtractCardsFromUrlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

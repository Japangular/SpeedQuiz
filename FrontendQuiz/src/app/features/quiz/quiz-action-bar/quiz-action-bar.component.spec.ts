import {ComponentFixture, TestBed} from '@angular/core/testing';

import {QuizActionBarComponent} from './quiz-action-bar.component';

describe('QuizActionBarComponent', () => {
  let component: QuizActionBarComponent;
  let fixture: ComponentFixture<QuizActionBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizActionBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuizActionBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizHistorySidebarComponentComponent } from './quiz-history-sidebar.component';

describe('QuizHistorySidebarComponentComponent', () => {
  let component: QuizHistorySidebarComponentComponent;
  let fixture: ComponentFixture<QuizHistorySidebarComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizHistorySidebarComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuizHistorySidebarComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

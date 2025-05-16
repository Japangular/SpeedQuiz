import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicCardCreatorComponent } from './dynamic-card-creator.component';

describe('DynamicCardCreatorComponent', () => {
  let component: DynamicCardCreatorComponent;
  let fixture: ComponentFixture<DynamicCardCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicCardCreatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicCardCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

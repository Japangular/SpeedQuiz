import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WanikaniComponent } from './wanikani.component';

describe('WanikaniComponent', () => {
  let component: WanikaniComponent;
  let fixture: ComponentFixture<WanikaniComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WanikaniComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WanikaniComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

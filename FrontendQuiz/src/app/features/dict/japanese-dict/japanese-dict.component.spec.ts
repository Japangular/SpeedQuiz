import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JapaneseDictComponent } from './japanese-dict.component';

describe('JapaneseDictComponent', () => {
  let component: JapaneseDictComponent;
  let fixture: ComponentFixture<JapaneseDictComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JapaneseDictComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JapaneseDictComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

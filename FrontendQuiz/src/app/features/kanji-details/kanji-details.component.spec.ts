import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KanjiDetailsComponent } from './kanji-details.component';

describe('KanjiDetailsComponent', () => {
  let component: KanjiDetailsComponent;
  let fixture: ComponentFixture<KanjiDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanjiDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KanjiDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

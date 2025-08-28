import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KanjiWallComponent } from './kanji-wall.component';

describe('KanjiWallComponent', () => {
  let component: KanjiWallComponent;
  let fixture: ComponentFixture<KanjiWallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanjiWallComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KanjiWallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

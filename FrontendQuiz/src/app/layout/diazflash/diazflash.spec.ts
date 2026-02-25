import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Diazflash } from './diazflash';

describe('Diazflash', () => {
  let component: Diazflash;
  let fixture: ComponentFixture<Diazflash>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Diazflash]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Diazflash);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

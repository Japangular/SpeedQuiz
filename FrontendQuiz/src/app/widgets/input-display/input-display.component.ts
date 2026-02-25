import {Component, OnDestroy, OnInit} from '@angular/core';
import {debounceTime, distinctUntilChanged, Subscription} from 'rxjs';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {StrokeOrderKanjiComponent} from '../kanji-stroke-order-grid/stroke-order-kanji.component';

@Component({
  selector: 'app-input-display',
  imports: [
    ReactiveFormsModule,
    StrokeOrderKanjiComponent
  ],
  templateUrl: './input-display.component.html',
  styleUrl: './input-display.component.css'
})
export class InputDisplayComponent implements OnInit, OnDestroy {
  kanjiControl = new FormControl('');
  debouncedKanji = ''; // This is bound to [japanese]
  private sub: Subscription | undefined;

  ngOnInit() {
    this.sub = this.kanjiControl.valueChanges
      .pipe(
        debounceTime(300),         // delay 300ms after typing stops
        distinctUntilChanged()     // ignore same values
      )
      .subscribe(value => {
        this.debouncedKanji = value || '';
      });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  // Optional: dummy handler if you want to ignore emitStrokeOrderComplete
  setWk(wk: any, result: any) {
    // No-op
  }
}

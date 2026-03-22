import {Component, OnDestroy, OnInit} from '@angular/core';
import {debounceTime, distinctUntilChanged, Subscription} from 'rxjs';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {StrokeOrderKanjiComponent} from '../kanji-stroke-order-grid/stroke-order-kanji.component';
import {MatFormField, MatInput} from '@angular/material/input';

@Component({
  selector: 'app-input-display',
  imports: [
    ReactiveFormsModule,
    StrokeOrderKanjiComponent,
    MatFormField,
    MatFormField,
    MatInput,
    MatFormField
  ],
  templateUrl: './input-display.component.html',
  styleUrl: './input-display.component.css'
})
export class InputDisplayComponent implements OnInit, OnDestroy {
  kanjiControl = new FormControl('');
  debouncedKanji = '';
  private sub: Subscription | undefined;

  ngOnInit() {
    this.sub = this.kanjiControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(value => {this.debouncedKanji = value || '';});
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  setWk(wk: any, result: any) {
    // No-op
  }
}

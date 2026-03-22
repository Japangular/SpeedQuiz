import {AfterViewInit, Component, ElementRef, HostListener, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {NgForOf} from '@angular/common';
import {DictStateService} from '../../services/dict-state.service';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {StrokeOrderKanjiComponent} from '../../widgets/kanji-stroke-order-grid/stroke-order-kanji.component';
import {WallKanji} from './kanji-wall.model';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-kanji-wall',
  imports: [
    StrokeOrderKanjiComponent,
    NgForOf,
    FormsModule,
    MatFormField,
    MatIcon,
    MatInput,
    MatButton,
    MatLabel
  ],
  templateUrl: './kanji-wall.component.html',
  styleUrl: './kanji-wall.component.css'
})
export class KanjiWallComponent implements AfterViewInit {
  wallKanjis: WallKanji[] = [];
  jouyouCount = -1;

  @ViewChild('kanjiBoard', {static: false}) boardRef!: ElementRef<HTMLElement>;
  @ViewChildren('kanjiRef', {read: ElementRef}) kanjiRefs!: QueryList<ElementRef<HTMLElement>>;

  cols = 0;
  rows = 0;

  oldFrom = 0;
  oldTo = 0;

  constructor(private dict: DictStateService, private router: Router) {
  }

  ngAfterViewInit() {
    // 1) Load data
    this.dict.parseJouyouKanjis().subscribe(() => this.check(0, 8));

    // 2) When the *ngFor finishes (or changes), measure again
    this.kanjiRefs.changes.subscribe(() => this.updateLayout());

    // 3) Just in case they already exist on first pass
    setTimeout(() => this.updateLayout());
  }

  @HostListener('window:resize')
  onResize() {
    this.updateLayout();
  }

  updateLayout() {
    const board = this.boardRef?.nativeElement;
    const firstEl = this.kanjiRefs?.first?.nativeElement;

    // Guard: if ngFor hasn’t created any child yet, bail out
    if (!board || !firstEl) return;

    const boardRect = board.getBoundingClientRect();
    const kanjiRect = firstEl.getBoundingClientRect();

    this.cols = Math.max(1, Math.floor(boardRect.width / kanjiRect.width));
    this.rows = Math.max(1, Math.floor(boardRect.height / kanjiRect.height));

    console.log(`Fits: ${this.cols} x ${this.rows}`);
    this.check(0, this.cols*this.rows);
  }

  setWk(wk: WallKanji, strokeOrderComplete: boolean) {
    wk.isSolved = strokeOrderComplete;
  }

  check(from = 0, fallbackCount = 8) {
    if(from === this.oldFrom && this.oldTo === fallbackCount){
      return;
    } else {
      this.oldFrom = from; this.oldTo = fallbackCount;
    }
    this.jouyouCount = this.dict.jouyou().length;

    // Render a first batch so there is at least one element to measure
    const to = Math.min(from + fallbackCount, this.jouyouCount);
    this.wallKanjis = this.dict.jouyou().slice(from, to).map(k => ({kanji: k.kanji, isSolved: false}));

    // After DOM paints, measure and (optionally) refetch the exact amount
    setTimeout(() => {
      this.updateLayout();

      const targetCount = this.cols * this.rows;
      if (targetCount > 0 && targetCount !== this.wallKanjis.length) {
        const to2 = Math.min(from + targetCount, this.jouyouCount);
        this.wallKanjis = this.dict.jouyou().slice(from, to2).map(k => ({kanji: k.kanji, isSolved: false}));

        console.log(this.wallKanjis.length);

        // After replacing the list, Angular will re-render; the `kanjiRefs.changes`
        // subscription will fire and `updateLayout()` will run again automatically.
      }
    });
  }

  onKanjiClick(event: MouseEvent, wk: WallKanji) {
    if (event.shiftKey) {
      this.router.navigate(['/quizCardApp', {outlets: {leftOutlet: ['kanjiDetails', wk.kanji]}}])
        .then(result => {
          console.log('Navigation result:', result); // Should log 'true' if successful
        })
        .catch(err => {
          console.error('Navigation failed:', err); // Logs error if navigation fails
        });

      event.stopPropagation(); // optional: prevent bubbling
    }
  }
}

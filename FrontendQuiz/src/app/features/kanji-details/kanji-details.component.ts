import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {StrokeOrderKanjiComponent} from '../quiz/widget/kanji-stroke-order-grid/stroke-order-kanji.component';
import {Location} from '@angular/common';

@Component({
  selector: 'app-kanji-details',
  imports: [
    StrokeOrderKanjiComponent
  ],
  templateUrl: './kanji-details.component.html',
  styleUrl: './kanji-details.component.css'
})
export class KanjiDetailComponent implements OnInit {
  kanji!: string;

  constructor(private route: ActivatedRoute, private location: Location) {
  }

  ngOnInit() {
    this.kanji = this.route.snapshot.paramMap.get('kanji')!;
    console.log('Showing details for kanji:', this.kanji);
  }

  goBack() {
    this.location.back();
  }
}

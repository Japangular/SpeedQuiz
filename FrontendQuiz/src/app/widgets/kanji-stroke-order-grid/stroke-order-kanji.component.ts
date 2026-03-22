import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {KanjiDisplayComponent} from "../kanji-display/kanji-display.component";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-stroke-order-kanji',
  standalone: true,
    imports: [
        CommonModule,
        KanjiDisplayComponent
    ],
    templateUrl: './stroke-order-kanji.component.html',
    styleUrl: './stroke-order-kanji.component.css'
})
export class StrokeOrderKanjiComponent {
  @ViewChild(KanjiDisplayComponent)
  kanjiDisplay!: KanjiDisplayComponent;
  isCorrect = BorderColor.ORANGE;

  @Input()
  japanese?: string;

  @Input()
  isWrapContent: boolean = false;

  @Output()
  emitStrokeOrderComplete: EventEmitter<boolean> = new EventEmitter<boolean>();
  isHorizontal: boolean = true;

  changeOrientation() {
    this.isHorizontal = !this.isHorizontal;
  }

  handleStrokeOrderComplete(b: boolean){
    b ? this.isCorrect = BorderColor.GREEN : this.isCorrect = BorderColor.RED;
    this.emitStrokeOrderComplete.emit(b);
  }

  protected readonly BorderColor = BorderColor;
}

enum BorderColor {
  ORANGE, RED, GREEN
}

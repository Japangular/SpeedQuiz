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

  @Input()
  japanese?: string;

  @Input()
  isWrapContent: boolean = false; // alter this value to change behavior

  @Output()
  emitStrokeOrderComplete: EventEmitter<boolean> = new EventEmitter<boolean>();
  isHorizontal: boolean = true;

  changeOrientation() {
    this.isHorizontal = !this.isHorizontal;
  }

  handleStrokeOrderComplete(b: boolean){
    this.emitStrokeOrderComplete.emit(b);
  }

  toggleStrokeNumbers(b: boolean){
    this.kanjiDisplay.toggleStrokeNumbers(b);
  }
}

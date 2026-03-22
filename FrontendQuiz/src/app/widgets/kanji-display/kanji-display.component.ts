import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, Renderer2, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'app-kanji-display',
  standalone: true,
  imports: [],
  template: `
      <div #kanjiContainer [innerHtml]="svgContent" class="kanji-container"></div>
  `,
    styles: [`
      .kanji-container svg {
        width: 100%;
        height: auto;
      }

      .kanji-container path {
        cursor: pointer;
        stroke-width: 3;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke: black; /* Default stroke color */
      }
    `]
})
export class KanjiDisplayComponent implements AfterViewInit, OnDestroy {
  private observer!: MutationObserver;
  @ViewChild('kanjiContainer') private kanjiContainer!: ElementRef;
  @Input()
  kanji: string = "取";
  @Output()
  strokeOrderComplete: EventEmitter<boolean> = new EventEmitter<boolean>();

  svgContent: any;
  private strokeNumbersVisible: boolean = true; // Initial visibility state
  private correctOrder: string[] = [];
  private currentIndex: number = 0;

  private strokeNumbersId: string = ""; // Store the stroke numbers ID
  private strokeIdValue = "";

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private renderer: Renderer2
  ) {
  }

  getSvgUrl(kanji: string): string {
    const cp = kanjiToKanjiVGFilename(kanji);
    return `http://localhost/kanjivg/${encodeURIComponent(cp)}`;
  }

  ngAfterViewInit() {
    this.observeSVGInsertion();
    this.loadSvg();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private observeSVGInsertion(): void {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          this.extractStrokeOrder();
          this.initializeStrokes();
          this.updateStrokeNumbersId();
          this.toggleStrokeNumbers(false);
        }
      });
    });

    this.observer.observe(this.kanjiContainer.nativeElement, {
      childList: true,
    });
  }

  private extractStrokeOrderOld(): void {
    let strokes = this.kanjiContainer.nativeElement.querySelector('[id^="kvg:StrokePaths"]');
    let ids = Array.from(strokes.children[0].children as NodeListOf<HTMLElement>).map(child => child.id);
    this.correctOrder = ids;

  }

  private extractStrokeOrder(): void {
    let strokes = this.kanjiContainer.nativeElement.querySelectorAll('[id^="kvg:"]');
    console.log("--> " +strokes.length)
    let ids = Array.from(strokes as NodeListOf<HTMLElement>).map(child => child.id).filter(el => /-s\d+$/.test(el))
    console.log(ids);
    this.correctOrder = ids;

    console.log("Extracted Strokes:", ids.length);
  }

  private safeParse(id: string): number {
    const match = id.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  loadSvg(): void {
    const url = this.getSvgUrl(this.kanji);
    console.log(url);
    this.http.get(url, {responseType: 'text'})
      .subscribe(svg => {
        svg = svg.replace("]>", "");
        this.svgContent = this.sanitizer.bypassSecurityTrustHtml(svg);
      });
  }


  initializeStrokes(): void {
    const container: HTMLElement = this.kanjiContainer.nativeElement;
    console.log(`Correct Order: ${this.correctOrder}`);
    this.correctOrder.forEach(id => {
      const stroke = container.querySelector(`#${id.replace(':', '\\:')}`);

      console.log(`Binding to: ${id}`, stroke);
      if (stroke) {
        this.renderer.listen(stroke, 'click', () => {
          this.checkStrokeOrder(stroke, id);
        });
      }
    });
  }

  updateStrokeNumbersId(): void {
    const container: HTMLElement = this.kanjiContainer.nativeElement;
    const strokeNumbersGroup = container.querySelector('g[id^="kvg:StrokeNumbers"]');
    if (strokeNumbersGroup) {
      this.strokeNumbersId = strokeNumbersGroup.id;
    }
  }

  checkStrokeOrder(stroke: Element, strokeId: string): void {
    console.log(stroke);
    console.log(strokeId);

    if (strokeId === this.correctOrder[this.currentIndex]) {
      this.renderer.setStyle(stroke, 'stroke', 'green');
      this.currentIndex++;
      if (this.currentIndex >= this.correctOrder.length) {
        this.strokeOrderComplete.emit(true);
      }
    } else {
      this.renderer.setStyle(stroke, 'stroke', 'red');
      this.strokeOrderComplete.emit(false);
      setTimeout(() => {
        this.renderer.setStyle(stroke, 'stroke', 'black');
      }, 800);
    }
  }

  resetStrokes(): void {
    const container: HTMLElement = this.kanjiContainer.nativeElement;
    this.correctOrder.forEach(id => {
      const stroke = container.querySelector(`#${id.replace(':', '\\:')}`);
      if (stroke) {
        this.renderer.setStyle(stroke, 'stroke', 'black');
      }
    });
    this.currentIndex = 0;
  }

  toggleStrokeNumbers(b: boolean): void {
    if (this.strokeNumbersId) {
      const container = this.kanjiContainer.nativeElement;
      const selector = `#${this.strokeNumbersId.replace(/:/g, '\\:')}`;
      const strokeNumbers = container.querySelector(selector);
      if (strokeNumbers) {
        this.strokeNumbersVisible = !this.strokeNumbersVisible;
        this.renderer.setStyle(strokeNumbers, 'display', b ? 'block' : 'none');
      }
    }
  }
}

function kanjiToKanjiVGFilename(kanji: string): string {
  if (kanji.length !== 1) {
    throw new Error("Input must be a single Kanji character.");
  }

  const codePoint = kanji.codePointAt(0); // handles surrogate pairs
  if (!codePoint) {
    throw new Error("Invalid character.");
  }

  return codePoint.toString(16).padStart(5, '0') + '.svg';
}

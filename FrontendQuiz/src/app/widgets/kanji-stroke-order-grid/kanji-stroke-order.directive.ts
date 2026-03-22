import {AfterViewInit, Directive, ElementRef, Renderer2} from '@angular/core';

@Directive({
  selector: '[strokeOrder]',
  standalone: true
})
export class KanjiStrokeOrderDirective implements AfterViewInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {

  }

  ngAfterViewInit() {
    this.applyStyle();
  }

  applyStyle() {
    this.renderer.setStyle(this.el.nativeElement, 'width', '102px');
    this.renderer.setStyle(this.el.nativeElement, 'height', '102px');
    this.renderer.setStyle(this.el.nativeElement, 'background',
      `repeating-linear-gradient(90deg, #FF8C00, #FF8C00 2px, transparent 2px, transparent 50px),
      repeating-linear-gradient(0deg, #FF8C00, #FF8C00 2px, transparent 2px, transparent 50px),
      repeating-linear-gradient(90deg, #e0e0e0, #e0e0e0 1px, transparent 1px, transparent 10px),
      repeating-linear-gradient(0deg, #e0e0e0, #e0e0e0 1px, transparent 1px, transparent 10px)`);
    this.renderer.setStyle(this.el.nativeElement, 'display', 'flex');
    this.renderer.setStyle(this.el.nativeElement, 'align-items', 'center');
    this.renderer.setStyle(this.el.nativeElement, 'justify-content', 'center');
    this.renderer.setStyle(this.el.nativeElement, 'box-shadow', '0 0 10px rgba(0, 0, 0, .15)');
    this.renderer.setStyle(this.el.nativeElement, 'color', '#333');
    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');


    this.renderer.setStyle(this.el.nativeElement, 'font-family', 'KanjiStrokeOrders, monospace');
    this.renderer.setStyle(this.el.nativeElement, 'text-align', 'center');
    this.renderer.setStyle(this.el.nativeElement, 'font-size', '102px');

    let children = this.el.nativeElement.children;
  }

}

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {detectRenderHint, RenderHint} from '../model/slot.model';

@Component({
  selector: 'app-display-slot',
  standalone: true,
  imports: [],
  template: `
    @switch (resolvedHint) {
      @case ('image') {
        <img [src]="value" [alt]="fieldName ?? 'question'" class="display-image"/>
      }
      @case ('kanji') {
        <span class="display-kanji"
              (click)="labelClick.emit({ value, event: $event })">
          @for (char of characters; track $index) {
            <span (click)="labelClick.emit({ value: char, event: $event })">{{ char }}</span>
          }
        </span>
      }
      @default {
        <span class="display-text"
              (click)="labelClick.emit({ value, event: $event })">
          {{ value }}
        </span>
      }
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .display-kanji {
      font-size: 2em;
      cursor: pointer;
      user-select: none;
    }

    .display-kanji span:hover {
      opacity: 0.7;
    }

    .display-text {
      font-size: 1.2em;
    }

    .display-image {
      max-width: 200px;
      max-height: 200px;
      border-radius: 8px;
    }
  `]
})
export class DisplaySlotComponent {
  @Input({required: true}) value!: string;
  @Input() renderHint?: RenderHint;
  @Input() fieldName?: string;
  @Output() labelClick = new EventEmitter<{ value: string; event: MouseEvent }>();

  get resolvedHint(): RenderHint {
    return this.renderHint ?? detectRenderHint(this.value);
  }

  get characters(): string[] {
    return Array.from(this.value);
  }
}

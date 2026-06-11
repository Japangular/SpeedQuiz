import {Component, EventEmitter, Input, Output} from '@angular/core';
import {detectRenderHint, RenderHint} from '../../model/slot.model';

@Component({
  selector: 'app-display-slot',
  standalone: true,
  imports: [],
  templateUrl: './display-slot.component.html',
  styleUrl: './display-slot.component.css'
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

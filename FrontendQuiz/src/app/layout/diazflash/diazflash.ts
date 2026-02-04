import {Component, EventEmitter, Output} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-diazflash',
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './diazflash.html',
  styleUrl: './diazflash.css',
})
export class Diazflash {
  @Output() buttonClicked = new EventEmitter<void>();

  protected buttonPressed() {
    // Emit an event instead of alerting
    this.buttonClicked.emit();
  }
}

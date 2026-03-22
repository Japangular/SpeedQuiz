import {Component, EventEmitter, Output} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-diazflash',
  imports: [
    NgOptimizedImage,
    MatIcon,
    MatButton
  ],
  templateUrl: './diazflash.html',
  styleUrl: './diazflash.css',
})
export class Diazflash {
  @Output() buttonClicked = new EventEmitter<void>();

  protected buttonPressed() {
    this.buttonClicked.emit();
  }
}

import {Component, Inject, TemplateRef} from '@angular/core';
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {NgTemplateOutlet} from '@angular/common';

export interface ContextSheetData {
  template: TemplateRef<any>;
  label: string;
}

@Component({
  selector: 'app-context-sheet',
  standalone: true,
  imports: [NgTemplateOutlet, MatIconButton, MatIcon],
  template: `
    <div class="sheet-header">
      <span class="sheet-handle"></span>
      <span class="sheet-title">{{ data.label }}</span>
      <button mat-icon-button (click)="dismiss()" aria-label="Close">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <div class="sheet-body">
      <ng-container *ngTemplateOutlet="data.template"></ng-container>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      max-height: 70vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .sheet-header {
      display: flex;
      align-items: center;
      padding: 8px 8px 8px 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      flex-shrink: 0;
    }

    .sheet-handle {
      width: 32px;
      height: 4px;
      border-radius: 2px;
      background: rgba(0, 0, 0, 0.2);
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
    }

    .sheet-title {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }

    .sheet-body {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  `]
})
export class ContextSheet {
  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: ContextSheetData,
    private sheetRef: MatBottomSheetRef<ContextSheet>,
  ) {}

  dismiss(): void {
    this.sheetRef.dismiss();
  }
}

import {AfterViewInit, Component, ElementRef, HostListener, OnDestroy, QueryList, signal, ViewChild, ViewChildren} from '@angular/core';
import {AnkiTableService} from './anki-table.service';
import {JsonPipe, NgForOf, NgIf} from '@angular/common';
import {AnkiPage} from './anki-table.model';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from '@angular/material/table';
import {MatSort, MatSortHeader} from '@angular/material/sort';
import {MatButton} from '@angular/material/button';
import {MatPaginator, PageEvent} from '@angular/material/paginator';

@Component({
  selector: 'app-anki-table',
  imports: [
    NgIf,
    MatCell,
    MatCellDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatSort,
    MatSortHeader,
    MatTable,
    NgForOf,
    MatColumnDef,
    MatHeaderCellDef,
    MatSort,
    MatPaginator,
  ],
  templateUrl: './anki-table.component.html',
  styleUrl: './anki-table.component.css'
})
export class AnkiTableComponent {
  ankiPage = signal<AnkiPage | null>(null);
  displayedColumns = ['index', 'question', 'reading', 'meaning'];
  pageSize = 100;
  pageIndex = 0;

  columnLabels: Record<string, string> = {
    index: 'Index',
    question: 'Question',
    reading: 'Reading',
    meaning: 'Meaning',
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('paginatorContainer') paginatorContainer!: ElementRef;
  @ViewChild(MatTable, {static: true}) table!: MatTable<any>;
  @ViewChild('spacer') spacer!: ElementRef;
  @ViewChild('headerRow') headerRow!: ElementRef;
  @ViewChildren('rowElement', {read: ElementRef}) rowElements!: QueryList<ElementRef>;

  constructor(private anki: AnkiTableService, private elRef: ElementRef) {
    const offset = this.pageIndex * this.pageSize;
    this.anki.getPage(this.pageSize, offset).subscribe(o => {
      this.ankiPage.set(o);

      // Delay to wait for view to update
      setTimeout(() => this.autoSetPageSize(), 5);
    });
  }

  autoSetPageSize() {
    const fullPageHeight = window.innerHeight;

    const paginatorHeight = this.paginatorContainer?.nativeElement?.offsetHeight || 0;

    const header = document.querySelector('mat-toolbar') as HTMLElement;
    const headerHeight = header?.offsetHeight || 56;

    const headerRowHeight = this.headerRow?.nativeElement?.offsetHeight || 56;

    const spacingBuffer = 0;

    const availableHeight = fullPageHeight - paginatorHeight - headerHeight - headerRowHeight - spacingBuffer;

    const rowHeight = this.rowElements.first?.nativeElement?.offsetHeight;

    if (!rowHeight) {
      console.warn('Row height not available yet.');
      return;
    }

    const calculatedPageSize = Math.floor(availableHeight / rowHeight);
    const usedHeight = (calculatedPageSize) * rowHeight;

    if (calculatedPageSize > 0 && calculatedPageSize !== this.pageSize) {
      this.pageSize = calculatedPageSize;
      this.pageIndex = 0;
      this.loadPage();
    }
    const spacerHeight = fullPageHeight - usedHeight - paginatorHeight - headerHeight - headerRowHeight - spacingBuffer;

    if (this.spacer?.nativeElement) {
      this.spacer.nativeElement.style.height = `${Math.max(spacerHeight, 0)}px`;
    }

  }

  loadPage() {
    const offset = this.pageIndex * this.pageSize;
    this.anki.getPage(this.pageSize, offset).subscribe(page => {
      this.ankiPage.set(page);
    });
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadPage();
  }

  @HostListener('window:resize', [])
  onResize() {
    this.autoSetPageSize();
  }
}


import {Component, ElementRef, HostListener, QueryList, signal, ViewChild, ViewChildren} from '@angular/core';
import {AnkiTableService} from './anki-table.service';
import {NgForOf, NgIf} from '@angular/common';
import {AnkiCard, AnkiPage} from './anki-table.model';
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
  MatTable,
} from '@angular/material/table';
import {MatSort, MatSortHeader} from '@angular/material/sort';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatAnchor} from '@angular/material/button';

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
    MatCheckbox,
    MatAnchor,
  ],
  templateUrl: './anki-table.component.html',
  styleUrl: './anki-table.component.css'
})
export class AnkiTableComponent {
  ankiPage = signal<AnkiPage | null>(null);
  displayedColumns = ['select', 'index', 'question', 'reading', 'meaning'];
  dataColumns = ['index', 'question', 'reading', 'meaning']; // for the loop

  pageSize = 100;
  pageIndex = 0;

  selectedRows = new Set<string>();

  columnLabels: Record<string, string> = {
    select: '',
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

  lastClickedIndex: string | null = null;

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

  toggleRow(row: AnkiCard, event: MouseEvent) {
    if (event.shiftKey && this.lastClickedIndex) {
      const pageData = this.ankiPage()?.data || [];
      const lastIdx = pageData.findIndex(r => r.index === this.lastClickedIndex);
      const currentIdx = pageData.findIndex(r => r.index === row.index);

      if (lastIdx !== -1 && currentIdx !== -1) {
        const [start, end] = [lastIdx, currentIdx].sort((a, b) => a - b);
        for (let i = start; i <= end; i++) {
          this.selectedRows.add(pageData[i].index);
        }
      }
    } else {
      if (this.selectedRows.has(row.index)) {
        this.selectedRows.delete(row.index);
      } else {
        this.selectedRows.add(row.index);
      }
    }
    this.lastClickedIndex = row.index;
  }

  isAllSelected(): boolean {
    const pageData = this.ankiPage()?.data || [];
    return pageData.length > 0 && pageData.every(row => this.selectedRows.has(row.index));
  }

  isSomeSelected(): boolean {
    const pageData = this.ankiPage()?.data || [];
    return !this.isAllSelected() && pageData.some(row => this.selectedRows.has(row.index));
  }

  toggleSelectAll(event: any) {
    const pageData = this.ankiPage()?.data || [];
    if (event.checked) {
      pageData.forEach(row => this.selectedRows.add(row.index));
    } else {
      pageData.forEach(row => this.selectedRows.delete(row.index));
    }
  }

  learnSelected() {
    if(this.selectedRows.size == 0){
      return;
    }

    this.anki.learnSelected(this.extractSelectedRows());
  }

  deleteSelected() {
    this.anki.deleteSelectedRows(this.extractSelectedRows())
  }

  extractSelectedRows(): AnkiCard[]{
    const pageData = this.ankiPage()?.data || [];
    const selectedIds = Array.from(this.selectedRows);
    const selected = pageData.filter(d => selectedIds.includes(d.index));
    console.log("anki-table: learn selected was pressed, " + selected.length + " rows were selected");
    return selected
  }
}


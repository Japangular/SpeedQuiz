import {AfterViewInit, Component, ElementRef, HostListener, QueryList, signal, ViewChild, ViewChildren} from '@angular/core';
import {AnkiTableService, UserTableStates} from './anki-table.service';
import {NgClass, NgForOf, NgIf} from '@angular/common';
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
import {MatCheckbox, MatCheckboxChange} from '@angular/material/checkbox';
import {MatAnchor} from '@angular/material/button';
import {Router} from '@angular/router';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatChip} from '@angular/material/chips';
import {MatIcon} from '@angular/material/icon';

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
    MatFormField,
    MatLabel,
    MatChip,
    MatIcon,
    NgClass,
  ],
  templateUrl: './anki-table.component.html',
  styleUrl: './anki-table.component.css'
})
export class AnkiTableComponent implements AfterViewInit {
  ankiPage = signal<AnkiPage | null>(null);
  displayedColumns = ['select', 'index', 'question', 'reading', 'meaning', 'ignore'];
  dataColumns = ['index', 'question', 'reading', 'meaning']; // for the loop

  pageSize = 100;
  pageIndex = 0;

  selectedRows = new Set<string>();
  ignoredRows = new Set<string>();
  ignoredSelected = false;

  _questionFilterValue = '';

  columnLabels: Record<string, string> = {
    select: '',
    index: 'Index',
    question: 'Question',
    reading: 'Reading',
    meaning: 'Meaning',
    ignore: 'Ignore',
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('paginatorContainer') paginatorContainer!: ElementRef;
  @ViewChild(MatTable, {static: false}) table!: MatTable<any>;
  @ViewChild('spacer') spacer!: ElementRef;
  @ViewChild('headerRow') headerRow!: ElementRef;
  @ViewChildren('rowElement', {read: ElementRef}) rowElements!: QueryList<ElementRef>;

  lastClickedIndex: string | null = null;

  constructor(private anki: AnkiTableService, private elRef: ElementRef, private router: Router) {
    const offset = this.pageIndex * this.pageSize;
    this.anki.getPage(this.pageSize, offset, this.questionFilterValue).subscribe(o => {
      this.ankiPage.set(o);

      // Delay to wait for view to update
      setTimeout(() => this.autoSetPageSize(), 5);
    });
  }

  ngAfterViewInit() {
    this.anki.getIgnoredAnkiRows().subscribe(tableStatus => tableStatus.rowIds.forEach(rowId => this.ignoredRows.add(rowId)))
  }

  get questionFilterValue(){
    return this._questionFilterValue;
  }

  set questionFilterValue(filterValue: string){
    this._questionFilterValue = filterValue;
  }


  // Filter out ignored rows if the Ignore checkbox is selected
  get filteredData() {
    const pageData = this.ankiPage()?.data || [];

    let filtered = pageData;

    // Apply "ignore" checkbox filter
    if (this.ignoredSelected) {
      filtered = filtered.filter(row => !this.ignoredRows.has(row.index));
    }

    // Apply search filter on `question` column
    if (this.questionFilterValue) {
      const term = this.questionFilterValue.toLowerCase();
      const f1 = filtered.filter(row =>
        row.question?.toLowerCase().includes(term)
      );
      if(f1.length > 1){
        filtered = f1;
      }
    }

    return filtered;
  }

  // Handle change in Ignore column checkbox
  onIgnoreColumnToggle(event: any) {
    this.ignoredSelected = event.checked;
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

  loadPage(questionFilterValue = "") {
    const offset = this.pageIndex * this.pageSize;
    this.anki.getPage(this.pageSize, offset, this.questionFilterValue).subscribe(page => {
      this.ankiPage.set(page);
      if(this.pageSize > page.data.length){
        this.pageSize = page.data.length;
      }
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

  ignoreRow(row: AnkiCard, event: MatCheckboxChange) {
    if (event.checked) {
      this.ignoredRows.add(row.index);
    } else {
      this.ignoredRows.delete(row.index);
    }
  }
  isIgnoredSelected(){
    return this.ignoredSelected;
  }

  isAllSelected(): boolean {
    const pageData = this.ankiPage()?.data || [];
    return pageData.length > 0 && pageData.every(row => this.selectedRows.has(row.index));
  }

  isSomeSelected(): boolean {
    const pageData = this.ankiPage()?.data || [];
    return !this.isAllSelected() && pageData.some(row => this.selectedRows.has(row.index));
  }

  isSomeIgnored(): boolean {
    const pageData = this.ankiPage()?.data || [];
    return !this.isIgnoredSelected() && pageData.some(row => this.ignoredRows.has(row.index));
  }

  toggleSelectAll(event: any) {
    const pageData = this.ankiPage()?.data || [];
    if (event.checked) {
      pageData.forEach(row => this.selectedRows.add(row.index));
    } else {
      pageData.forEach(row => this.selectedRows.delete(row.index));
    }
  }

  ignoreSelectAll(event: any) {
    this.ignoredSelected = !this.ignoredSelected;
  }

  learnSelected() {
    if(this.selectedRows.size == 0){
      return;
    }

    this.anki.learnSelected(this.extractSelectedRows());
    this.router.navigate(['/quizCardApp', {outlets: {leftOutlet: ['quiz']}}])
      .then(result => {
        console.log('Navigation result:', result); // Should log 'true' if successful
      })
      .catch(err => {
        console.error('Navigation failed:', err); // Logs error if navigation fails
      });
  }

  persistIgnoredAnkiRows() {
    const rowIdsToDelete = Array.from(this.ignoredRows); // convert Set to array
    this.anki.persistIgnoredAnkiRows(rowIdsToDelete).subscribe(message => console.log("persist ignored anki rows concluded with : " + message));
  }

  extractSelectedRows(): AnkiCard[]{
    const pageData = this.ankiPage()?.data || [];
    const selectedIds = Array.from(this.selectedRows);
    const selected = pageData.filter(d => selectedIds.includes(d.index));
    console.log("anki-table: learn selected was pressed, " + selected.length + " rows were selected");
    return selected
  }

  applyFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.questionFilterValue = input.value.trim().toLowerCase();

    // Optional: trigger table render
    this.table.renderRows();
  }

  applyQuestionFilterFromClick(charOrWord: string) {
    if(charOrWord && charOrWord.trim().length > 0){
      if(this.questionFilterValue !== charOrWord){
        this.questionFilterValue = charOrWord;
        this.anki.applyQuestionFilter(charOrWord);
        this.loadPage(charOrWord);
        this.table.renderRows();
      } else {
        this.clearQuestionFilter()
      }
    }
  }

  clearQuestionFilter() {
    if(this.questionFilterValue === ""){
      this.highlightQuestionColumn = true;
      setTimeout(() => {
        this.highlightQuestionColumn = false;
      }, 300); // Highlight lasts 1.5 second
    } else {
      this.questionFilterValue = "";
      this.autoSetPageSize();
      this.anki.applyQuestionFilter("");
      this.table.renderRows();
    }
  }

  _highlightQuestionColumn = false;

  set highlightQuestionColumn(b: boolean){
    console.log(JSON.stringify(b));
    this._highlightQuestionColumn = b;
  }

  get highlightQuestionColumn(){
    return this._highlightQuestionColumn;
  }

  getFilterChipText() {
    if(this.questionFilterValue.trim().length === 0){
      return "Click a kanji in the question column to filter";
    } else {
      return "All questions that contain " + this.questionFilterValue + " kanji";
    }
    return "";
  }
}


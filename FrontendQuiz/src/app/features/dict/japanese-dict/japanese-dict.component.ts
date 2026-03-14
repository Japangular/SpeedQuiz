import {Component, effect, signal, WritableSignal} from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {MatInput} from '@angular/material/input';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatProgressBar} from '@angular/material/progress-bar';
import {FormsModule} from '@angular/forms';
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
import {MatRadioButton, MatRadioGroup} from '@angular/material/radio';
import {mapEntryToQuizData, SearchMode, WORD_FEATURE_PROPERTIES} from './japanese-dict.model';
import {DictStateService} from '../../../services/dict-state.service';

@Component({
  selector: 'app-japanese-dict',
  imports: [
    MatFormField,
    MatCard,
    NgForOf,
    MatIcon,
    MatInput,
    MatIconButton,
    MatProgressBar,
    FormsModule,
    NgIf,
    MatLabel,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatCellDef,
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatRowDef,
    MatHeaderCellDef,
    TitleCasePipe,
    MatRadioGroup,
    MatRadioButton,
  ],
  templateUrl: './japanese-dict.component.html',
  styleUrl: './japanese-dict.component.css'
})
export class JapaneseDictComponent {
  TIMEOUT_MS = 30000;
  private _loadingTimeoutHandle: any;
  loading = signal<boolean>(false);
  searchTerm: WritableSignal<string> ;
  displayedColumns = signal<string[]>([]);

  tableResults = signal<any[]>([]);

  selectedOption: WritableSignal<SearchMode>;
  searchModes = SearchMode;

  protected readonly mapEntryToQuizData = mapEntryToQuizData;

  constructor(protected dict: DictStateService) {
    this.selectedOption = dict.selectedOption;
    this.searchTerm = dict.searchTerm;

    effect(() => {
      const mode = this.dict.selectedOption();
      let results: any[] = [];

      switch (mode) {
        case SearchMode.Kanji:
          results = this.dict.kanjiResults();
          break;
        case SearchMode.Tokenize:
          results = this.dict.tokenizeResults();
          if (results.length > 0) {
            this.displayedColumns.set(WORD_FEATURE_PROPERTIES);
            this.tableResults.set(results);
            return;
            //return;
          } else {
            this.displayedColumns.set([]);
          }
          console.log("tokenize");
          break;
        case SearchMode.JoujouKanjis:
          results = this.dict.jouyouKanjis();
          break;
      }
      if (results.length > 0) {
        this.displayedColumns.set(Object.keys(results[0]));
        this.tableResults.set(results);
      } else {
        this.displayedColumns.set([]);
      }
    });
  }

  triggerSearch(){
    this.dict.search(this.selectedOption(), this.searchTerm());
  }

  setLoading(value: boolean) {
    if (value && !this.loading()) {
      console.log('loading on');
      this.loading.set(true);

      this._loadingTimeoutHandle = setTimeout(() => {
        if (this.loading()) {
          console.warn('Search timed out.');
          this.loading.set(false);
          alert("This functionality doesn't work as expected. Please try something else.");
        }
      }, this.TIMEOUT_MS);
    } else if (!value && this.loading()) {
      console.log('loading off');
      this.loading.set(false);

      if (this._loadingTimeoutHandle) {
        clearTimeout(this._loadingTimeoutHandle);
        this._loadingTimeoutHandle = null;
      }
    }
  }

  selectedColumns: Set<string> = new Set();

  toggleColumnSelection(column: string) {
    if (this.dict.selectedOption() === this.searchModes.Combined) {
      if (this.selectedColumns.has(column)) {
        this.selectedColumns.delete(column);
      } else {
        this.selectedColumns.add(column);
      }
    }
  }

  isColumnSelected(column: string): boolean {
    return this.selectedColumns.has(column);
  }

  isJousou() {
    return this.dict.selectedOption() == SearchMode.JoujouKanjis
  }
}

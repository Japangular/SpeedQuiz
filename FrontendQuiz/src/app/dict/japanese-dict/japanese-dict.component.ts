import { Component } from '@angular/core';
import {Entry, JapaneseDictService, KanjiDTO, mapKanjiToQuizData} from './japanese-dict.service';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {JsonPipe, NgForOf, NgIf, TitleCasePipe} from '@angular/common';
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

@Component({
  selector: 'app-japanese-dict',
  imports: [
    MatCardContent,
    MatFormField,
    MatCardTitle,
    MatCard,
    NgForOf,
    MatIcon,
    MatInput,
    MatIconButton,
    MatProgressBar,
    FormsModule,
    NgIf,
    MatLabel,
    JsonPipe,
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
  searchTerm = '火';
  entryResults: Entry[] = [];
  kanjiResults: any[] = [];
  displayedColumns: string[] = [];
  _loading = false;
  TIMEOUT_MS = 30000;
  private _loadingTimeoutHandle: any;
  jouyouKanjis: KanjiDTO[] = [];

  constructor(private dictionaryService: JapaneseDictService) {
  }

  set loading(value: boolean) {
    if (value && !this._loading) {
      console.log("loading on");
      this._loading = true;

      this._loadingTimeoutHandle = setTimeout(() => {
        if (this._loading) {
          console.warn("Search timed out.");
          this._loading = false;
          alert("This functionality doesn't work as expected. Please try something else.");
        }
      }, this.TIMEOUT_MS);
    } else if (!value && this._loading) {
      console.log("loading off");
      this._loading = false;


      if (this._loadingTimeoutHandle) {
        clearTimeout(this._loadingTimeoutHandle);
        this._loadingTimeoutHandle = null;
      }
    }
  }

  get loading(): boolean {
    return this._loading;
  }

  onSearch(): void {
    const term = this.searchTerm.trim();
    if (!term) return;

    this.loading = true;

    console.log("asking backend for term " + term);

    switch (this.selectedOption) {
      case SearchMode.Kanji:
        this.searchKanji();
        this.TIMEOUT_MS = 2000;
        break;

      case SearchMode.Tokenize:
        console.log("tokenize");
        const a = this.TIMEOUT_MS;
        this.TIMEOUT_MS = 2000;
        this.tokenizeText();
        this.TIMEOUT_MS = a;
        break;

      case SearchMode.VocabCards:
        this.generateVocabCards();
        break;

      case SearchMode.JoujouKanjis:
        this.parseJouyouKanjis();
        this.TIMEOUT_MS = 2000;
        break;

      default:
        console.warn('Invalid search mode selected:', this.selectedOption);
        this.loading = false;
        break;
    }
  }

  tokenizeText() {
    this.dictionaryService.searchMecab(this.searchTerm).subscribe(tokens => {
      this.kanjiResults = tokens.map(token => {
        const {surface, features} = token;

        return {
          surface,
          ...features
        };
      });

      if (this.kanjiResults.length > 0) {
        this.displayedColumns = Object.keys(this.kanjiResults[0]);
      }

      this.loading = false;
    });
  }

  generateVocabCards(){

  }

  parseJouyouKanjis(){
    if(this.jouyouKanjis.length === 0){
      this.dictionaryService.jouyouKanjis().subscribe(kanjis => this.jouyouKanjis = kanjis);
    }
  }

  searchKanji() {
    this.dictionaryService.searchKanji(this.searchTerm).subscribe({
      next: (data: KanjiDTO[]) => {
        console.log("number of kanji received: " + data.length);
        this.kanjiResults = data;
        this.displayedColumns = Object.keys(data[0]);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  searchEntries(){
    this.dictionaryService.searchEntries(this.searchTerm).subscribe({
      next: (data) => {
        console.log("data received");
        this.entryResults = data;
        console.log(this.entryResults.length);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  getReadings(entry: Entry): string {
    return JSON.stringify(entry);
  }

  protected readonly mapEntryToQuizData = mapEntryToQuizData;
  protected readonly mapKanjiToQuizData = mapKanjiToQuizData;
  searchModes = SearchMode;
  selectedOption: SearchMode = SearchMode.Kanji;

}

export enum SearchMode {
  Kanji = 'kanji',
  Tokenize = 'tokenize',
  VocabCards = 'vocab_cards',
  JoujouKanjis = 'jouyouKanjis',
}

function mapEntryToQuizData(entry: any) {
  const kanji = entry.kele?.map((k: any) => k.keb).join(", ") || "";
  const readings = entry.rele?.map((r: any) => r.reb).join(", ") || "";
  const meanings = entry.sense?.flatMap((s: any) => s.gloss) || [];
  const pos = entry.sense?.flatMap((s: any) => s.pos || []) || [];
  const xrefs = entry.sense?.flatMap((s: any) => s.xref || []) || [];
  const ants = entry.sense?.flatMap((s: any) => s.ant || []) || [];
  const misc = entry.sense?.flatMap((s: any) => s.misc || []) || [];

  return {
    kanji,
    readings,
    meanings,
    pos,
    crossReferences: xrefs,
    antonyms: ants,
    miscTags: misc,
    question: `What does the word "${kanji}" (${readings}) mean?`,
    info: pos.join(", ") + (misc.length ? " — " + misc.join(", ") : ""),
    hints: xrefs.length ? "See also: " + xrefs.join(", ") : "",
  };
}

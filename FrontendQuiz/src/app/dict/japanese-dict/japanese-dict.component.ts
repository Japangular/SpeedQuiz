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
  ],
  templateUrl: './japanese-dict.component.html',
  styleUrl: './japanese-dict.component.css'
})
export class JapaneseDictComponent {
  searchTerm = '火';
  entryResults: Entry[] = [];
  kanjiResults: any[] = []; // This will hold the results from the API
  displayedColumns: string[] = []; // This will hold the dynamic columns
  loading = false;
  jouyouKanjis: KanjiDTO[] = [];

  constructor(private dictionaryService: JapaneseDictService) {
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) return;
    this.searchKanji();
    this.loading = true;
    console.log("asking backend for term " + this.searchTerm.trim())

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
    question: `What does the word "${kanji}" (${readings}) mean?`, // Example question
    info: pos.join(", ") + (misc.length ? " — " + misc.join(", ") : ""),
    hints: xrefs.length ? "See also: " + xrefs.join(", ") : "",
  };
}

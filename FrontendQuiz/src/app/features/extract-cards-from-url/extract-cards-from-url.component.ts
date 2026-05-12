import {Component, inject, ViewChild} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatStepper, MatStepperModule} from '@angular/material/stepper';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {NgForOf, NgIf, SlicePipe} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {MatButtonModule, MatIconButton} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {PropertyType} from '../../../generated/api';
import {ParseResult, ParseOptions, ColumnRole, parsePastedText} from './paste-parser';
import {DeckStore} from '../../store/deck.store';
import { QUIZ_API_TOKEN } from '../../interfaces/quiz-api';
import {MatTooltip} from '@angular/material/tooltip';

export interface DeckCard {
  [key: string]: string;
}

@Component({
  selector: 'app-extract-cards-from-url',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    SlicePipe,
    MatCardModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltip,
  ],
  templateUrl: './extract-cards-from-url.component.html',
  styleUrls: ['./extract-cards-from-url.component.css'],
})
export class ExtractCardsFromUrlComponent {
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private deckStore = inject(DeckStore);
  private quizApi = inject(QUIZ_API_TOKEN);

  @ViewChild(MatStepper) stepper!: MatStepper;

  pastedText = '';
  parseResult: ParseResult | null = null;
  parseError = '';
  columnRoles: ColumnRole[] = [];

  deckCards: DeckCard[] = [];
  deckColumnHeaders: string[] = [];
  deckColumnKeys: string[] = [];
  private hiraganaKeys: string[] = [];
  private questionKey = '';
  private answerKeys: string[] = [];

  saving = false;
  saved = false;

  onPasteInput(text: string): void {
    this.pastedText = text;
    this.parseError = '';

    if (!text.trim()) {
      this.parseResult = null;
      this.columnRoles = [];
      return;
    }

    try {
      this.parseResult = parsePastedText(text);
      this.columnRoles = [...this.parseResult.suggestedRoles];
    } catch (e) {
      this.parseError = 'Could not parse the pasted text. Try adjusting the format.';
      this.parseResult = null;
    }
  }

  reparse(overrides: ParseOptions): void {
    if (!this.pastedText.trim()) return;

    try {
      const currentOptions: ParseOptions = {
        skipLines: this.parseResult?.skipLines ?? 0,
        columnsPerCard: this.parseResult?.columnsPerCard ?? 3,
        ...overrides,
      };
      this.parseResult = parsePastedText(this.pastedText, currentOptions);
      this.columnRoles = [...this.parseResult.suggestedRoles];
      this.parseError = '';
    } catch (e) {
      this.parseError = 'Could not parse with those settings.';
    }
  }

  setColumnRole(index: number, role: ColumnRole): void {
    this.columnRoles[index] = role;
  }

  buildDeck(): void {
    if (!this.parseResult || this.parseResult.rows.length === 0) return;

    const headers = this.parseResult.columnHeaders;

    const activeColumns: { index: number; header: string; role: ColumnRole }[] = [];
    for (let i = 0; i < headers.length; i++) {
      if (this.columnRoles[i] !== 'skip') {
        activeColumns.push({index: i, header: headers[i], role: this.columnRoles[i]});
      }
    }

    if (!activeColumns.some(c => c.role === 'question')) {
      this.snackBar.open('Please assign at least one column as "Question"', 'OK', {duration: 4000});
      return;
    }

  // an answer-shaped column for the validation check — hiragana counts as an answer
  const isAnswerLike = (r: ColumnRole) => r === 'answer' || r === 'hiragana';
  if (!activeColumns.some(c => isAnswerLike(c.role))) {
    this.snackBar.open('Please assign at least one column as "Answer" or "Hiragana"', 'OK', {duration: 4000});
      return;
    }

    this.deckColumnHeaders = activeColumns.map(c => c.header);
    this.deckColumnKeys = activeColumns.map(c => c.header);
    this.questionKey = activeColumns.find(c => c.role === 'question')!.header;
    this.answerKeys = activeColumns.filter(c => c.role === 'answer').map(c => c.header);
  this.hiraganaKeys = activeColumns.filter(c => c.role === 'hiragana').map(c => c.header);

    this.deckCards = this.parseResult.rows.map(row => {
      const card: DeckCard = {};
      for (const col of activeColumns) {
        card[col.header] = row[col.index] ?? '';
      }
      return card;
    });

    this.snackBar.open(`${this.deckCards.length} cards ready for review`, 'OK', {duration: 3000});
  }



  removeCard(index: number): void {
    this.deckCards = this.deckCards.filter((_, i) => i !== index);
    // Shift split indices to keep them pointing at the right rows
    const shifted = new Set<number>();
    const shiftedNames = new Map<number, string>();
    for (const s of this.splitsAfter) {
      if (s < index) {
        shifted.add(s);
        const n = this.sectionNames.get(s);
        if (n) shiftedNames.set(s, n);
      } else if (s >= index) {
        // Drop split if it was exactly at this row's boundary; otherwise shift down
        const newIdx = s - 1;
        if (newIdx >= 0) {
          shifted.add(newIdx);
          const n = this.sectionNames.get(s);
          if (n) shiftedNames.set(newIdx, n);
        }
      }
    }
    this.splitsAfter = shifted;
    this.sectionNames = shiftedNames;
  }

  practiceNow(): void {
    const deck = this.buildDeckContent();
    this.deckStore.loadDeck(deck, 'Imported Deck', 'imported-paste');
    this.router.navigate(['/quiz']);
  }

  saveDeck(): void {
    if (this.deckCards.length === 0 || this.saving) return;

    this.saving = true;

    const deck = this.buildDeckContent();
    this.deckStore.loadDeck(deck, 'Imported Deck', 'imported-paste');
    this.quizApi.createDeck('Imported Deck', deck).subscribe();

    setTimeout(() => {
      this.saving = false;
      this.saved = true;
      this.snackBar.open('Deck saved!', 'OK', {duration: 3000});
    }, 1000);
  }

  splitsAfter = new Set<number>();
  sectionNames = new Map<number, string>();
  firstSectionName: string = ''

  toggleSplitAfter(rowIndex: number): void {
    if (this.splitsAfter.has(rowIndex)) {
      this.splitsAfter.delete(rowIndex);
      this.sectionNames.delete(rowIndex);
    } else {
      this.splitsAfter.add(rowIndex);
    }
  }

  renameSection(splitIndex: number, name: string): void {
    if (name.trim()) {
      this.sectionNames.set(splitIndex, name.trim());
    } else {
      this.sectionNames.delete(splitIndex);
    }
  }

  defaultSectionName(splitIndex: number): string {
    // Section number = how many splits come at-or-before this one
    const sectionNumber = [...this.splitsAfter]
      .filter(s => s <= splitIndex)
      .length + 1;
    return `Section ${sectionNumber}`;
  }

  displaySectionName(splitIndex: number): string {
    return this.sectionNames.get(splitIndex) ?? this.defaultSectionName(splitIndex);
  }

  resetStepper(): void {
    this.pastedText = '';
    this.parseResult = null;
    this.parseError = '';
    this.columnRoles = [];
    this.deckCards = [];
    this.deckColumnHeaders = [];
    this.deckColumnKeys = [];
    this.saving = false;
    this.saved = false;
    this.splitsAfter.clear();
    this.sectionNames.clear();
    this.stepper.reset();
  }

  private buildDeckContent() {
    const properties: Record<string, PropertyType> = {};
    properties[this.questionKey] = PropertyType.Question;
    for (const key of this.answerKeys)   properties[key] = PropertyType.Answer;
    for (const key of this.hiraganaKeys) properties[key] = PropertyType.Hiragana;
    return { properties, cards: this.deckCards };
  }
}

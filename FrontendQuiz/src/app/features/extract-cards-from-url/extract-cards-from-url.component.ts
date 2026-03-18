import {Component, inject, OnDestroy, ViewChild} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatStepper, MatStepperModule} from '@angular/material/stepper';
import {ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {NgForOf, NgIf, SlicePipe} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {AnkiTableComponent} from '../anki-table/anki-table.component';
import {AnkiSourceService} from '../anki-table/anki-source.service';
import {JsonSourceService} from '../anki-table/json-source.service';
import {AnkiTableService} from '../anki-table/anki-table.service';
import {AnkiCard} from '../anki-table/anki-table.model';
import {CardStoreService} from '../../services/card-store.service';
import {QuizBoardService} from '../quiz/quiz-board/quiz-board.service';
import {CardViewComponent} from '../quiz/card-view/card-view.component';
import {PropertyType} from '../../../generated/api';
import {SubmissionDeck} from '../../models/deck.model';
import {ParseResult, ParseOptions, parsePastedText} from './paste-parser';

type ColumnRole = 'question' | 'answer' | 'skip';

@Component({
  selector: 'app-extract-cards-from-url',
  standalone: true,
  imports: [
    ReactiveFormsModule,
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
    AnkiTableComponent,
    CardViewComponent,
  ],
  // Local instances so this stepper's quiz doesn't interfere with the global quiz state
  viewProviders: [
    JsonSourceService,
    {provide: AnkiSourceService, useExisting: JsonSourceService},
    AnkiTableService,
    CardStoreService,
    QuizBoardService,
  ],
  templateUrl: './extract-cards-from-url.component.html',
  styleUrls: ['./extract-cards-from-url.component.css'],
})
export class ExtractCardsFromUrlComponent implements OnDestroy {
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private jsonSource = inject(JsonSourceService);
  private quizBoardService = inject(QuizBoardService);
  private cardStore = inject(CardStoreService);

  @ViewChild(MatStepper) stepper!: MatStepper;
  @ViewChild(AnkiTableComponent) ankiTable!: AnkiTableComponent;

  // ── Step 1: Paste & parse ─────────────────────────────────

  pastedText = '';
  parseResult: ParseResult | null = null;
  parseError = '';
  columnRoles: ColumnRole[] = [];

  // ── Steps 2-4: unchanged state ────────────────────────────

  selectedCards: AnkiCard[] = [];
  saving = false;
  saved = false;

  // ── Step 1 methods ────────────────────────────────────────

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
      this.autoAssignRoles();
    } catch (e) {
      this.parseError = 'Could not parse the pasted text. Try adjusting the format.';
      this.parseResult = null;
    }
  }

  /**
   * Re-parse with user-adjusted settings (skip lines, columns per card).
   */
  reparse(overrides: ParseOptions): void {
    if (!this.pastedText.trim()) return;

    try {
      const currentOptions: ParseOptions = {
        skipLines: this.parseResult?.skipLines ?? 0,
        columnsPerCard: this.parseResult?.columnsPerCard ?? 3,
        ...overrides,
      };
      this.parseResult = parsePastedText(this.pastedText, currentOptions);
      this.autoAssignRoles();
      this.parseError = '';
    } catch (e) {
      this.parseError = 'Could not parse with those settings.';
    }
  }

  /**
   * Auto-assign column roles based on detected headers.
   * First column → question, rest → answer.
   */
  private autoAssignRoles(): void {
    if (!this.parseResult) return;
    this.columnRoles = this.parseResult.columnHeaders.map((_, i) =>
      i === 0 ? 'question' : 'answer'
    );
  }

  setColumnRole(index: number, role: ColumnRole): void {
    this.columnRoles[index] = role;
  }

  /**
   * Build AnkiCard[] from parsed rows + column roles, feed into JsonSourceService.
   */
  buildDeck(): void {
    if (!this.parseResult || this.parseResult.rows.length === 0) return;

    const questionIdx = this.columnRoles.indexOf('question');
    const answerIndices = this.columnRoles
      .map((role, i) => role === 'answer' ? i : -1)
      .filter(i => i >= 0);

    if (questionIdx < 0) {
      this.snackBar.open('Please assign at least one column as "Question"', 'OK', {duration: 4000});
      return;
    }

    if (answerIndices.length === 0) {
      this.snackBar.open('Please assign at least one column as "Answer"', 'OK', {duration: 4000});
      return;
    }

    const headers = this.parseResult.columnHeaders;

    const cards: AnkiCard[] = this.parseResult.rows.map((row, i) => {
      // Build a card that fits AnkiCard's shape.
      // question = the question column
      // reading = first answer column (often kana)
      // meaning = second answer column (often English), or same as reading if only one answer
      const question = row[questionIdx] ?? '';
      const answers = answerIndices.map(idx => row[idx] ?? '');

      return {
        index: String(i),
        question,
        reading: answers[0] ?? '',
        meaning: answers.length > 1 ? answers[1] : answers[0] ?? '',
      };
    });

    this.jsonSource.setCards(cards);

    this.snackBar.open(`${cards.length} cards ready for preview`, 'OK', {duration: 3000});
  }

  // ── Step 2: Preview (existing behavior) ───────────────────

  onStartQuiz(): void {
    const selectedIndices = this.ankiTable.selectedRows;
    const allCards = this.jsonSource['cards']; // access via the local instance

    this.selectedCards = allCards.filter(card => selectedIndices.has(card.index));

    if (this.selectedCards.length === 0) {
      this.snackBar.open('Select at least one card to practice', 'OK', {duration: 3000});
      return;
    }

    const deck: SubmissionDeck = {
      deckName: 'ImportedDeck',
      properties: {
        question: PropertyType.Question,
        reading: PropertyType.Answer,
        meaning: PropertyType.Answer,
      },
      cards: this.selectedCards.map(c => ({
        question: c.question,
        reading: c.reading,
        meaning: c.meaning,
      })),
    };

    this.cardStore.setCurrentDeck(deck);
  }

  // ── Step 4: Save ──────────────────────────────────────────

  saveCards(): void {
    if (this.selectedCards.length === 0 || this.saving) return;

    this.saving = true;

    const deck: SubmissionDeck = {
      deckName: 'ImportedDeck',
      properties: {
        question: PropertyType.Question,
        reading: PropertyType.Answer,
        meaning: PropertyType.Answer,
      },
      cards: this.selectedCards.map(c => ({
        question: c.question,
        reading: c.reading,
        meaning: c.meaning,
      })),
    };

    this.cardStore.setCurrentDeck(deck, 'ImportedDeck');
    this.cardStore.sendCurrentDeck();

    // Simple timeout since sendCurrentDeck is fire-and-forget
    setTimeout(() => {
      this.saving = false;
      this.saved = true;
      this.snackBar.open('Deck saved!', 'OK', {duration: 3000});
    }, 1000);
  }

  goToDecks(): void {
    this.router.navigate(['/deckShelf']);
  }

  resetStepper(): void {
    this.pastedText = '';
    this.parseResult = null;
    this.parseError = '';
    this.columnRoles = [];
    this.selectedCards = [];
    this.saving = false;
    this.saved = false;
    this.stepper.reset();
  }

  ngOnDestroy(): void {
    // Nothing to save — paste state is ephemeral
  }
}

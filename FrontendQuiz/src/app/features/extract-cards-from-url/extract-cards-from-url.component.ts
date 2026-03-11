import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatStepper, MatStepperModule} from '@angular/material/stepper';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {NgIf} from '@angular/common';
import {MatListModule} from '@angular/material/list';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {CardsFromUrlModel, ExtractCardsFromUrlService} from './extract-cards-from-url.service';
import {MatFormFieldModule} from '@angular/material/form-field';
import {AnkiTableComponent} from '../anki-table/anki-table.component';
import {AnkiSourceService} from '../anki-table/anki-source.service';
import {JsonSourceService} from '../anki-table/json-source.service';
import {AnkiTableService} from '../anki-table/anki-table.service';
import {AnkiCard, mapToAnkiCard} from '../anki-table/anki-table.model';
import {ExtractCardStateService} from './extract-card-state.service';
import {CardStoreService} from '../../services/card-store.service';
import {QuizBoardService} from '../quiz/quiz-board/quiz-board.service';
import {CardViewComponent} from '../quiz/card-view/card-view.component';
import {LocalProfileService} from '../../user-store-management/local-profile.service';
import {PropertyType} from '../../../generated/api';
import {SubmissionDeck} from '../../models/deck.model';


async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

@Component({
  selector: 'app-extract-cards-from-url',
  standalone: true,
  imports: [
    // Angular
    ReactiveFormsModule,
    NgIf,
    // Material
    MatCardModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatListModule,
    AnkiTableComponent,
    CardViewComponent,
  ],
  // viewProviders ensures all children (AnkiTable, QuizBoard, CardView, QuizActionBar)
  // resolve to these local instances instead of the global root-provided ones.
  viewProviders: [
    JsonSourceService,
    {provide: AnkiSourceService, useExisting: JsonSourceService},
    AnkiTableService,
    CardStoreService,   // local instance — isolates quiz deck from global state
    QuizBoardService,   // local instance — uses the local CardStoreService above
  ],
  templateUrl: './extract-cards-from-url.component.html',
  styleUrls: ['./extract-cards-from-url.component.css'],
})
export class ExtractCardsFromUrlComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private importService = inject(ExtractCardsFromUrlService);
  private jsonSource = inject(JsonSourceService);
  private stateService = inject(ExtractCardStateService);
  private quizBoardService = inject(QuizBoardService);
  private profileService = inject(LocalProfileService);
  quizContainerHeight = 400; // safe fallback

  @ViewChild(MatStepper) stepper!: MatStepper;
  @ViewChild(AnkiTableComponent) ankiTable!: AnkiTableComponent;
  @ViewChild('quizContainer') quizContainer!: ElementRef;

  selectedCards: AnkiCard[] = [];
  saving = false;
  saved = false;

  ngOnInit(){
    // 1. Try in-memory state first (navigating within the SPA)
    const saved = this.stateService.restore();
    if (saved) {
      this.connectionStatus = saved.connectionStatus;
      this.payload = saved.payload;
      this.credentialsForm.patchValue({provider: saved.chosenProvider})
      if (this.payload){
        const cards = mapToAnkiCard(JSON.stringify(this.payload));
        this.jsonSource.setCards(cards);
      }

      setTimeout(() => this.stepper.selectedIndex = saved.stepIndex);
      return;
    }

    // 2. No in-memory state → check localStorage for a previously hashed token
    const cached = this.stateService.loadTokenHash();
    if (cached) {
      this.credentialsForm.patchValue({
        provider: cached.provider,
        claimedName: cached.claimedName,
      });
      this.snackBar.open(
        `Cached session found for "${cached.claimedName}". Click Test Connection to use the cache.`,
        'OK',
        { duration: 5000 }
      );
    }
  }

  ngOnDestroy() {
    this.stateService.save({
      chosenProvider: this.credentialsForm.value.provider,
      stepIndex: this.stepper?.selectedIndex?? 0,
      connectionStatus: this.connectionStatus,
      payload: this.payload,
    });
  }

  /** Stepper config */
  isLinear = true;

  /** Step 1: credentials — token is no longer required (cached hash can replace it) */
  credentialsForm: FormGroup = this.fb.group({
    provider: ['wanikani', Validators.required],
    claimedName: ['', Validators.required],
    token: [''],
  });

  /** UI state */
  loading = false;
  connectionStatus?: {
    username: string;
  };
  connectionError!: string;

  /** Step 2: preview */
  previewCards: ImportedCard[] = [];
  payload?: any;
  /* -----------------------------------------
   * Step 1: test API connection
   * ----------------------------------------- */
  async testConnection(): Promise<void> {
    const {provider, claimedName, token} = this.credentialsForm.value;
    if (!claimedName || !provider) {
      return;
    }

    this.loading = true;
    this.connectionStatus = undefined;
    this.connectionError = "";

    const cached = this.stateService.loadTokenHash();
    let tokenHashValue: string | undefined;

    if (token) {
      tokenHashValue = await hashToken(token);
    } else if (cached && cached.claimedName === claimedName && cached.provider === provider) {
      tokenHashValue = cached.tokenHash;
    }

    if (!token && !tokenHashValue) {
      this.snackBar.open('Please enter your API token', 'Close', { duration: 4000 });
      this.loading = false;
      return;
    }

    const request: CardsFromUrlModel = {
      provider: provider,
      claimedName: claimedName,
      apiToken: token || '',
      tokenHash: tokenHashValue,
    };

    this.importService
      .testConnection(request)
      .subscribe({
        next: status => {
          if(status.connectionTested && !status.connectionFailed){
            this.connectionStatus = {username: status.connectedUser? status.connectedUser : "no username"};
            this.payload = status.payload;

            if (this.payload) {
              const cards = mapToAnkiCard(JSON.stringify(this.payload));
              this.jsonSource.setCards(cards);
            }

            if (tokenHashValue) {
              this.stateService.saveTokenHash({
                claimedName: claimedName,
                tokenHash: tokenHashValue,
                provider: provider,
              });
            }

            this.snackBar.open(
              `Connected as ${status.connectedUser}`,
              'OK',
              {duration: 3000}
            );
          } else if (status.connectionTested && status.connectionFailed) {
            this.stateService.clearTokenHash();
            this.snackBar.open("token failed for given connection", 'Close', {
              duration: 4000,
            });
          } else {
            this.snackBar.open("Connection failed to establish", 'Close', {
              duration: 4000,
            });
          }
          this.loading = false;
        },
        error: err => {
          this.connectionError =
            err?.error?.message ?? 'Failed to connect to API';
          this.snackBar.open(this.connectionError, 'Close', {
            duration: 4000,
          });
          this.loading = false;
        },
      });
  }

  /* -----------------------------------------
   * Step 2 → Step 3: feed selected cards into local quiz
   * ----------------------------------------- */
  onStartQuiz(): void {
    this.selectedCards = this.ankiTable.extractSelectedRows();
    if (this.selectedCards.length > 0) {
      this.quizBoardService.learnSelected(this.selectedCards);
      this.stepper.next();
    }
  }

  private updateQuizHeight(): void {
    if (this.quizContainer) {
      const top = this.quizContainer.nativeElement.getBoundingClientRect().top;
      const stepActionsBuffer = 48;
      this.quizContainerHeight = window.innerHeight - top - stepActionsBuffer;
    }
  }

  /* -----------------------------------------
   * Step 2: fetch homework preview
   * ----------------------------------------- */
  loadPreview(): void {
    if (!this.connectionStatus) {
      return;
    }

    this.loading = true;
    this.previewCards = [];

    const {provider, claimedName, token} = this.credentialsForm.value;

    this.importService
      .fetchHomework({provider: provider, claimedName: claimedName, apiToken: token} as CardsFromUrlModel)
      .subscribe({
        next: cards => {
          this.previewCards = cards;
          this.loading = false;
        },
        error: err => {
          this.snackBar.open(
            err?.error?.message ?? 'Failed to fetch homework',
            'Close',
            {duration: 4000}
          );
          this.loading = false;
        },
      });
  }

  /* -----------------------------------------
   * Step 4: save practiced cards to backend
   * ----------------------------------------- */
  saveCards(): void {
    if (this.selectedCards.length === 0 || this.saving) return;

    this.saving = true;

    const provider = this.credentialsForm.value.provider ?? 'unknown';
    const username = this.profileService.getDisplayName() ?? 'anonymous';

    // Build a SubmissionDeck from the practiced AnkiCards
    const deck: SubmissionDeck = {
      deckName: `${provider}-import-${new Date().toISOString().slice(0, 10)}`,
      username: username,
      properties: {
        question: PropertyType.Question,
        reading: PropertyType.Answer,
        meaning: PropertyType.Answer,
      },
      cards: this.selectedCards.map(card => ({
        question: card.question,
        reading: card.reading,
        meaning: card.meaning,
      })),
    };

    this.importService.saveDeck(deck).subscribe({
      next: () => {
        this.saving = false;
        this.saved = true;
        this.snackBar.open(
          `${this.selectedCards.length} cards saved to "${deck.deckName}"`,
          'OK',
          {duration: 3000}
        );
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Failed to save cards', 'Close', {duration: 4000});
      },
    });
  }

  /* -----------------------------------------
   * Step 3: finalize import (legacy — kept for compatibility)
   * ----------------------------------------- */
  finalizeImport(): void {
    if (!this.previewCards.length) {
      return;
    }

    this.importService.commitCards(this.previewCards).subscribe({
      next: () => {
        this.snackBar.open(
          `${this.previewCards.length} cards imported`,
          'OK',
          {duration: 3000}
        );
      },
      error: () => {
        this.snackBar.open(
          'Failed to save imported cards',
          'Close',
          {duration: 4000}
        );
      },
    });
  }

  /* -----------------------------------------
   * Navigation helpers
   * ----------------------------------------- */
  goToDecks(): void {
    this.router.navigate(['/table']);
  }

  resetStepper(): void {
    this.credentialsForm.reset({
      provider: 'wanikani',
      apiUrl: 'https://api.wanikani.com/v2',
      token: '',
    });

    this.previewCards = [];
    this.selectedCards = [];
    this.connectionStatus = undefined;
    this.connectionError = "";
    this.saved = false;
    this.stateService.clearTokenHash();
  }

  protected ignoreCurrentQuizCard() {

  }
}

export interface ImportedCard {
  front: string;
  back: string;
  meta?: {
    source: 'wanikani';
    level?: number;
    subjectId?: number;
  };
}

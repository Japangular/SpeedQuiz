import {AsyncPipe, DatePipe} from '@angular/common';
import {Component, OnInit, inject} from '@angular/core';
import {MatBadgeModule} from '@angular/material/badge';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {Observable, catchError, filter, forkJoin, map, of, shareReplay, switchMap, take} from 'rxjs';
import {DeckShelfService} from './deck-shelf.service';
import {LocalProfile, LocalProfileService} from '../../user-store-management/local-profile.service';
import {DeckContent, DeckInfo} from '../../../generated/api';
import {DeckStore} from '../../store/deck.store';
import {DeckTransferService} from './deck-transfer.service';
import {DeckRunSummary, DeckTimerService, formatDuration} from '../quiz/deck-timer.service';
import {MatTooltip} from '@angular/material/tooltip';

export interface DeckSelection {
  deck: DeckInfo;
  maxCards?: number;
}

export interface DeckGroup {
  attribution: string;
  decks: DeckInfo[];
}

@Component({
  selector: 'app-deck-shelf',
  imports: [
    AsyncPipe,
    DatePipe,
    MatProgressBarModule,
    MatCardModule,
    MatExpansionModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatBadgeModule,
    MatTooltip
  ],
  templateUrl: './deck-shelf.component.html',
  styleUrl: './deck-shelf.component.css'
})
export class DeckShelfComponent implements OnInit {
  deckGroups$!: Observable<DeckGroup[]>;
  error: string | null = null;
  loadingDeckId: string | null = null;
  multiSelectMode = false;
  selectedDecks: Map<string, DeckSelection> = new Map();

  private deckStore = inject(DeckStore);
  private static readonly INITIAL_BATCH_SIZE = 30;

  private deckTransfer = inject(DeckTransferService);
  private deckTimer = inject(DeckTimerService);

  /**
   * Best run per deck, read once per shelf load rather than from the template —
   * each lookup parses localStorage, and the template re-evaluates constantly.
   */
  runStats = new Map<string, DeckRunSummary>();
  private snackBar = inject(MatSnackBar);

  constructor(
    private deckShelfService: DeckShelfService,
    private profileService: LocalProfileService,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.loadDecks();
  }

  private loadDecks(): void {
    this.error = null;
    this.deckGroups$ = this.profileService.profile$.pipe(
      filter((p): p is LocalProfile => p != null),
      take(1),
      switchMap(() => this.deckShelfService.getDeckOverview()),
      map(decks => {
        this.runStats = new Map(
          decks
            .map(deck => [deck.id, this.deckTimer.summaryFor(deck.id)] as const)
            .filter((pair): pair is readonly [string, DeckRunSummary] => pair[1] !== null),
        );

        const groups = new Map<string, DeckInfo[]>();
        for (const deck of decks) {
          if (!groups.has(deck.attribution)) groups.set(deck.attribution, []);
          groups.get(deck.attribution)!.push(deck);
        }
        return Array.from(groups.entries()).map(([attribution, decks]) => ({ attribution, decks }));
      }),
      catchError(err => {
        console.error('Failed to load decks', err);
        this.error = 'Could not load decks. Please try again later.';
        return of([]);
      }),
      shareReplay(1)
    );
  }

  deleteDeck(deck: DeckInfo): void {
    if (!confirm(`Delete "${deck.name}"? This removes the deck and its progress.`)) return;

    this.deckShelfService.deleteDeck(deck.id).subscribe({
      next: () => {
        const last = localStorage.getItem('japangular_last_deck');
        if (last && JSON.parse(last).deckId === deck.id) {
          localStorage.removeItem('japangular_last_deck');
        }
        this.deckTimer.forgetDeck(deck.id);
        this.loadDecks();
      },
      error: err => {
        console.error('Failed to delete deck', err);
        this.error = 'Could not delete the deck. Please try again.';
      }
    });
  }

  loadDeck(deck: DeckInfo): void {
    if (this.multiSelectMode) {
      this.toggleSelection(deck);
      return;
    }

    this.loadingDeckId = deck.id;

    this.deckShelfService.loadDeck(deck.id).subscribe({
      next: (deckContent) => {
        this.loadingDeckId = null;

        const provisioned = this.provisionSingleDeck(deckContent);
        localStorage.setItem('japangular_last_deck', JSON.stringify({
          deckId: deck.id,
          deckName: deck.name
        }));
        this.deckStore.loadDeck(provisioned, deck.name, deck.id);
        this.router.navigate(['/quiz']);
      },
      error: (err) => {
        this.loadingDeckId = null;
        console.error('Failed to load deck', err);
      }
    });
  }

  toggleMultiSelectMode(): void {
    this.multiSelectMode = !this.multiSelectMode;
    if (!this.multiSelectMode) {
      this.selectedDecks.clear();
    }
  }

  toggleSelection(deck: DeckInfo): void {
    if (this.selectedDecks.has(deck.id)) {
      this.selectedDecks.delete(deck.id);
    } else {
      this.selectedDecks.set(deck.id, {
        deck,
        maxCards: DeckShelfComponent.INITIAL_BATCH_SIZE
      });
    }
  }

  isSelected(deckId: string): boolean {
    return this.selectedDecks.has(deckId);
  }

  get selectionCount(): number {
    return this.selectedDecks.size;
  }

  loadSelectedDecks(): void {
    const selections = Array.from(this.selectedDecks.values());
    if (selections.length === 0) return;

    // Single selection → fall back to normal load
    if (selections.length === 1) {
      this.loadDeck(selections[0].deck);
      return;
    }

    this.loadingDeckId = 'multi';

    const loads$ = selections.map(sel =>
      this.deckShelfService.loadDeck(sel.deck.id).pipe(
        map(content => ({
          content,
          maxCards: sel.maxCards,
          deckName: sel.deck.name,
        }))
      )
    );

    forkJoin(loads$).subscribe({
      next: (results) => {
        this.loadingDeckId = null;

        const merged = this.provisionMultiDeck(results);
        const mixedName = results.map(r => r.deckName).join(' + ');
        const mixedId = 'mixed-' + selections.map(s => s.deck.id).sort().join('-');

        this.deckStore.loadDeck(merged, mixedName, mixedId);
        this.selectedDecks.clear();
        this.multiSelectMode = false;
        this.router.navigate(['/quiz']);
      },
      error: (err) => {
        this.loadingDeckId = null;
        console.error('Failed to load mixed decks', err);
      }
    });
  }

  private provisionSingleDeck(deckContent: DeckContent): DeckContent {
    return {
      properties: deckContent.properties,
      cards: deckContent.cards.slice(0, DeckShelfComponent.INITIAL_BATCH_SIZE)
    };
  }

  private provisionMultiDeck(
    sources: { content: DeckContent; maxCards?: number; deckName: string }[]
  ): DeckContent {
    const properties = sources[0].content.properties;

    const allCards = sources.flatMap(source => {
      return source.maxCards
        ? source.content.cards.slice(0, source.maxCards)
        : source.content.cards;
    });

    return {properties, cards: allCards};
  }

  bestTime(stats: DeckRunSummary): string {
    return formatDuration(stats.bestMs, true);
  }

  exportDeck(deck: DeckInfo): void {
    this.deckTransfer.exportToFile(deck).subscribe({
      error: () => this.snackBar.open('Export failed.', 'OK', {duration: 4000}),
    });
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';                      // allow re-importing the same file
    if (!file) return;

    this.deckTransfer.importFile(file).subscribe({
      next: result => {
        this.snackBar.open(`Imported "${result.name}"`, 'OK', {duration: 3000});
        this.loadDecks();
      },
      error: err => this.snackBar.open(err?.message ?? 'Import failed.', 'OK', {duration: 5000}),
    });
  }

  learnDeck(deck: DeckInfo): void {
    this.router.navigate(['/learn', deck.id], {state: {deckName: deck.name}});
  }
}


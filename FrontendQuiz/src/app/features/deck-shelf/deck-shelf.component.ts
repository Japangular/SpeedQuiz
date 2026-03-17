
import { Component, OnInit } from '@angular/core';
import {forkJoin, Observable, catchError, of} from 'rxjs';
import { filter, take, switchMap, map, shareReplay } from 'rxjs/operators';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import {DeckShelfService} from './deck-shelf.service';
import {LocalProfile, LocalProfileService} from '../../user-store-management/local-profile.service';
import { Router } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatBadgeModule} from '@angular/material/badge';
import {DeckInfo, DeckContent} from '../../../generated/api';
import { CardStoreService } from '../../services/card-store.service';
import {DeckBarComponent} from '../deck-bar/deck-bar.component';

/**
 * A single deck to include in a multi-deck quiz session.
 * maxCards = undefined means "use all cards from this deck".
 */
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
    NgForOf,
    NgIf,
    MatProgressBarModule,
    MatCardModule,
    MatExpansionModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatBadgeModule,
    DeckBarComponent,
  ],
  templateUrl: './deck-shelf.component.html',
  styleUrl: './deck-shelf.component.css'
})
export class DeckShelfComponent implements OnInit {
  deckGroups$!: Observable<DeckGroup[]>;
  error: string | null = null;
  loadingDeckId: string | null = null;

  /** When true, user can check multiple decks and hit "Start mixed quiz". */
  multiSelectMode = false;

  /** Decks the user has checked in multi-select mode. */
  selectedDecks: Map<string, DeckSelection> = new Map();

  private static readonly INITIAL_BATCH_SIZE = 30;

  constructor(
    private deckShelfService: DeckShelfService,
    private profileService: LocalProfileService,
    private cardStore: CardStoreService,
    private router: Router
  ) {}

  ngOnInit() {
    this.deckGroups$ = this.profileService.profile$.pipe(
      filter((p): p is LocalProfile => p != null),
      take(1),
      switchMap(profile =>
        this.deckShelfService.getDeckOverview(
          profile.token,
          profile.wkClaimedName,
          profile.wkTokenHash
        )
      ),
      map(decks => {
        const groups = new Map<string, DeckInfo[]>();

        for (const deck of decks) {
          if (!groups.has(deck.attribution)) {
            groups.set(deck.attribution, []);
          }
          groups.get(deck.attribution)!.push(deck);
        }

        return Array.from(groups.entries()).map(([attribution, decks]) => ({
          attribution,
          decks
        }));
      }),
      catchError(err => {
        console.error('Failed to load decks', err);
        this.error = 'Could not load decks. Please try again later.';
        return of([]);
      }),
      shareReplay(1)
    );
  }

  // ── Single deck load (existing behavior, now with deckId) ────

  loadDeck(deck: DeckInfo): void {
    if (this.multiSelectMode) {
      this.toggleSelection(deck);
      return;
    }

    this.loadingDeckId = deck.id;

    const ownerId = this.profileService.getToken() ?? '';

    this.deckShelfService.loadDeck(deck.id, ownerId).subscribe({
      next: (deckContent) => {
        this.loadingDeckId = null;

        // Provisioner logic: slice to initial batch size.
        // QuizBoardService.initSession() handles sort strategy + session creation.
        const provisioned = this.provisionSingleDeck(deckContent);

        // Pass deck.id so QuizBoardService can persist session state against it
        this.cardStore.setCurrentDeck(provisioned, deck.name, deck.id);
        this.router.navigate(['/quiz']);
      },
      error: (err) => {
        this.loadingDeckId = null;
        console.error('Failed to load deck', err);
      }
    });
  }

  // ── Multi-deck selection ─────────────────────────────────────

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

  /**
   * Load all selected decks, take first N cards from each, merge, and navigate to quiz.
   * The merged deck gets a synthetic deckId for session persistence.
   */
  loadSelectedDecks(): void {
    const selections = Array.from(this.selectedDecks.values());
    if (selections.length === 0) return;

    // Single selection → fall back to normal load
    if (selections.length === 1) {
      this.loadDeck(selections[0].deck);
      return;
}

    this.loadingDeckId = 'multi';
    const ownerId = this.profileService.getToken() ?? '';

    const loads$ = selections.map(sel =>
      this.deckShelfService.loadDeck(sel.deck.id, ownerId).pipe(
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

        this.cardStore.setCurrentDeck(merged, mixedName, mixedId);
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

  // ── Provisioner logic ────────────────────────────────────────

  /**
   * Provision a single deck: slice to initial batch size.
   * The slice happens here (DeckShelf = provisioner), not in QuizBoardService.
   */
  private provisionSingleDeck(deckContent: DeckContent): DeckContent {
    return {
      properties: deckContent.properties,
      cards: deckContent.cards.slice(0, DeckShelfComponent.INITIAL_BATCH_SIZE)
    };
  }

  /**
   * Provision a mixed deck from multiple sources.
   *
   * Takes first N cards from each deck (respecting per-deck maxCards),
   * merges them into a single DeckContent.
   *
   * Assumes all decks share compatible property schemas.
   * If they don't, the first deck's properties win — cards from other decks
   * will simply have empty values for missing keys.
   */
  private provisionMultiDeck(
    sources: { content: DeckContent; maxCards?: number; deckName: string }[]
  ): DeckContent {
    // Use the first deck's property schema as the base
    const properties = sources[0].content.properties;

    const allCards = sources.flatMap(source => {
      const sliced = source.maxCards
        ? source.content.cards.slice(0, source.maxCards)
        : source.content.cards;
      return sliced;
    });

    return {properties, cards: allCards};
  }
}

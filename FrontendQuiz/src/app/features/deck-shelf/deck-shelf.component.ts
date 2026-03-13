
import { Component, OnInit } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
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
import {DeckInfo} from '../../../generated/api';

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
  ],
  templateUrl: './deck-shelf.component.html',
  styleUrl: './deck-shelf.component.css'
})
export class DeckShelfComponent implements OnInit {
  deckGroups$!: Observable<DeckGroup[]>;
  error: string | null = null;
  loadingDeckId: string | null = null;

  constructor(
    private deckShelfService: DeckShelfService,
    private profileService: LocalProfileService,
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

  loadDeck(deck: DeckInfo): void {
    this.loadingDeckId = deck.id;

    const ownerId = this.profileService.getToken() ?? '';

    this.deckShelfService.loadDeck(deck.id, ownerId).subscribe({
      next: (submissionDeck) => {
        this.loadingDeckId = null;
        // TODO: feed submissionDeck into CardStoreService / navigate to quiz
        console.log('Loaded deck:', submissionDeck);
      },
      error: (err) => {
        this.loadingDeckId = null;
        console.error('Failed to load deck', err);
      }
    });
  }
}

export interface DeckGroup {
  attribution: string;
  decks: DeckInfo[];
}

import {Component, inject} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatChipsModule} from '@angular/material/chips';
import {CardStoreService} from '../../services/card-store.service';
import {map, shareReplay} from 'rxjs/operators';
import {MatBadge} from '@angular/material/badge';
import {MatCard, MatCardAvatar, MatCardContent, MatCardTitle} from '@angular/material/card';
import {DeckContent, PropertyType} from '../../../generated/api';
import {MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuTrigger} from '@angular/material/menu';

@Component({
  selector: 'app-deck-bar',
  imports: [
    AsyncPipe,
    MatToolbarModule,
    MatIconModule,
    MatChipsModule,
    MatBadge,
    MatCard,
    MatCardTitle,
    MatIconButton,
    MatMenuTrigger,
    MatMenu,
    MatCardContent,
    MatCardAvatar,
  ],
  templateUrl: './deck-bar.component.html',
  styleUrl: './deck-bar.component.css'
})
export class DeckBarComponent {
  private store = inject(CardStoreService);

  deck$ = this.store.currentDeck$.pipe(
    map(deck => ({
      name: this.store.currentDeckName,
      cards: deck.cards,
      properties: deck.properties
    })),
    shareReplay(1)
  );

  questions$ = this.deck$.pipe(
    map(deck => this.extractByType(deck, PropertyType.Question))
  );

  hints$ = this.deck$.pipe(
    map(deck => this.extractByType(deck, PropertyType.Answer))
  );

// DRY helper
  private extractByType(deck: DeckContent, type: PropertyType): string[] {
    const key = Object.entries(deck.properties)
      .find(([_, t]) => t === type)?.[0];
    if (!key) return [];
    return deck.cards.map(card => card[key]);
  }
}

import {Component, inject, OnInit} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { CardStoreService } from '../../services/card-store.service';
import {map, shareReplay} from 'rxjs/operators';
import {MatBadge} from '@angular/material/badge';
import {MatCard, MatCardAvatar, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';
import {Observable, of} from 'rxjs';
import {DeckContent, PropertyType} from '../../../generated/api';
import {MatList, MatListItem} from '@angular/material/list';
import {MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';

@Component({
  selector: 'app-deck-bar',
  imports: [
    AsyncPipe,
    MatToolbarModule,
    MatIconModule,
    MatChipsModule,
    MatBadge,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatList,
    MatListItem,
    MatIconButton,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatCardContent,
    MatCardAvatar,
  ],
  templateUrl: './deck-bar.component.html',
  styleUrl: './deck-bar.component.css'
})
export class DeckBarComponent {
  private store = inject(CardStoreService);

  deck$ = this.store._currentDeck$.pipe(
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

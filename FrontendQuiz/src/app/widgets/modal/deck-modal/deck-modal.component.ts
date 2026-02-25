import { Component } from '@angular/core';
import {CardStoreService} from '../../../services/card-store.service';
import {AsyncPipe, JsonPipe} from '@angular/common';

@Component({
  selector: 'app-deck-modal',
  imports: [
    AsyncPipe,
    JsonPipe
  ],
  templateUrl: './deck-modal.component.html',
  styleUrl: './deck-modal.component.css'
})
export class DeckModalComponent {
  currentDeck$;

  constructor(private store: CardStoreService) {
    this.currentDeck$ = this.store._currentDeck$
  }

}

import {Component, EventEmitter, Inject, InjectionToken, OnDestroy, OnInit, Output} from '@angular/core';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {NgForOf, NgIf} from '@angular/common';
import {DECK_CHOOSER_TOKEN, DeckChooser, DeckMetadata} from '../dynamic-card-creator/submission-deck.model';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-deck-chooser',
  imports: [
    MatFormField,
    MatSelect,
    MatOption,
    NgForOf,
    MatLabel,
  ],
  templateUrl: './deck-chooser.component.html',
  styleUrl: './deck-chooser.component.scss'
})
export class DeckChooserComponent {
  @Output() deckSelected = new EventEmitter<any>();

  constructor(@Inject(DECK_CHOOSER_TOKEN) private deckChooser: DeckChooser) {
  }

  decks = [
    {deckname: 'First Deck', properties: {Frage: 'question', Antwort: 'answer'}},
    {deckname: 'Second Deck', properties: {Term: 'term', Definition: 'definition'}}
  ];

  selectedDeck: any;

  onDeckSelect(deck: any) {
    this.selectedDeck = deck;
    this.deckSelected.emit(deck);
    this.deckChooser.sendSelectedDeckMetadata(deck);
  }

  formatProperties(props: any): string {
    return Object.entries(props).map(([k, v]) => `${k}: ${v}`).join(' | ');
  }
}

import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {NgForOf} from '@angular/common';
import {DeckApiService} from '../../../services/deck-api.service';
import {DeckMetadata} from '../../../../generated/api';
import {PropertyType} from '../../dynamic-card-creator/submission-deck.model';

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
export class DeckChooserComponent implements OnInit {
  username = "app initializer";

  @Output() deckSelected: EventEmitter<string> = new EventEmitter<string>();

  constructor(private deckChooser: DeckApiService) {
  }

  ngOnInit(): void {
    this.deckChooser.availableDecksGet().subscribe(decks => this.setDecks(decks));
  }

  decks: DeckMetadata[] = [
    {deckName: 'First Deck', properties: {Frage: PropertyType.Question, Antwort: PropertyType.Answer}, username: this.username},
    {deckName: 'Second Deck', properties: {Term: PropertyType.Question, Definition: PropertyType.Answer}, username: this.username}
  ];

  selectedDeck: any;

  onDeckSelect(deck: DeckMetadata) {
    this.selectedDeck = deck;
    this.deckSelected.emit(deck.deckName);
  }

  formatProperties(props: any): string {
    return Object.entries(props).map(([k, v]) => `${k}: ${v}`).join(' | ');
  }

  setDecks(decks: DeckMetadata[]){
    this.decks = decks;
    console.log("decks received")
  }
}

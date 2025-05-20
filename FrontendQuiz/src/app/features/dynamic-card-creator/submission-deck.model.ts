import {Observable} from 'rxjs';
import {InjectionToken} from '@angular/core';
import {QUIZ_API_TOKEN, QuizApi} from '../../interfaces/SubmissionDeckApi';
import {DefaultService} from '../../api';
import {CardStoreService} from '../../services/card-store.service';

export enum PropertyType {
  QUESTION = 'question',
  ANSWER = 'answer',
  HINT = 'hint',
  IMAGE = 'image',
  SVG = 'svg',
  AUDIOFILE = 'audio',
  UNKNOWN = 'unknown'  // Define an UNKNOWN type if needed
}

export interface Card {
  name: PropertyType;
  value: string;
}

export interface DeckMetadata {
  name: string;
  properties: { [key: string]: PropertyType };
}

export interface UserGeneratedDeck extends DeckMetadata {
  cards: Card[];
}

export interface UserGeneratedDeckSubmissionService {
  sendUserGeneratedDeck(deck: UserGeneratedDeck): void;
}

export interface DeckChooser {
  getDeckMetadata(): DeckMetadata[];
  sendSelectedDeckMetadata(deckMetadata: DeckMetadata): void;
}

export const DECK_CHOOSER_TOKEN = new InjectionToken<DeckChooser>('DeckChooser');

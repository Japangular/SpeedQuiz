import {Observable} from 'rxjs';
import {InjectionToken} from '@angular/core';

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

export interface UserGeneratedDeck {
  name: string;

  properties: { [key: string]: PropertyType };
  cards: Card[];
}

export interface UserGeneratedDeckSubmissionService {
  sendUserGeneratedDeck(deck: UserGeneratedDeck): void;
}

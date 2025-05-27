import {DeckMetadata} from '../../../generated/api';

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
  [key: string]: string;
}

export interface UserGeneratedDeck extends DeckMetadata {
  cards: Card[];
}

export interface UserGeneratedDeckSubmissionService {
  sendUserGeneratedDeck(deck: UserGeneratedDeck): void;
}

import {DeckMetadata, PropertyType as ApiPropertyType} from '../../../generated/api';

export const PropertyType = ApiPropertyType;
export type PropertyType = typeof PropertyType[keyof typeof PropertyType];

export interface Card {
  [key: string]: string;
}

export interface UserGeneratedDeck extends DeckMetadata {
  cards: Card[];
}

export interface UserGeneratedDeckSubmissionService {
  sendUserGeneratedDeck(deck: UserGeneratedDeck): void;
}

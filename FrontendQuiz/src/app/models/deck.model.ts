import {PropertyType} from '../../generated/api';

export {PropertyType} from '../../generated/api';

export interface DeckInfo {
  id: string;
  name: string;
  description?: string;
  attribution?: string;
}

export interface DeckContent {
  properties: Record<string, PropertyType>;
  cards: Record<string, string>[];
}

export interface DeckPage {
  cards: Record<string, string>[];
  totalCards: number;
  offset: number;
  limit: number;
}

export interface DeckCardState {
  deckId: string;
  cardId: string;
  state: string;
}

// Backward compatibility — remove these as you migrate each file
export type SubmissionDeck = DeckContent & { deckName?: string; username?: string };
export type DeckMetadata = { properties: Record<string, PropertyType>, deckName?: string; username?: string }

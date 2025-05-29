export interface Card {
  index: number;
  level: number;
  subjectType: string;
  question: string;
  reading: string;
  meaning: string;
  info: string;
  hint: string;
  subjectId: number;
}

export interface Deck {
  cards: Card[];
  index: number;
}

export interface AnkiCard {
  index: string;
  question: string;
  reading: string;
  meaning: string;
}

export interface AnkiPageInfo {
  totalAvailableRows: number;
  columnNames: string[];
}

export interface AnkiPage {
  data: AnkiCard[];
  info: AnkiPageInfo;
}

export const DEV_DECK_NAME = "dev_ignored_anki_rows";

export interface UserTableStates {
  deckname: string;
  rowIds: string[];
}

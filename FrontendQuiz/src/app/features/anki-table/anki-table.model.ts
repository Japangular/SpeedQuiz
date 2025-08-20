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

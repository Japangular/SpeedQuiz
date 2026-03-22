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

export interface  UserTableStates {
  deckname: string;
  rowIds: string[];
}

export function mapToAnkiCard(json: string): AnkiCard[] {
  try {
    const parsed = JSON.parse(json);

    return parsed.map((item: any, index: number) => ({
      index: index.toString(),
      question: item.question ?? '',
      reading: item.reading ?? '',
      meaning: item.meaning ?? ''
    }));
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return [];
  }
}

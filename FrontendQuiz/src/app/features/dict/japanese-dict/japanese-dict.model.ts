export interface EntryDto {
  entSeq: number;
  kanji: string[];
  readings: string[];
  senses: SenseDto[];
}

export interface SenseDto {
  glosses: string[];
  partsOfSpeech: string[];
  crossReferences: string[];
  antonyms: string[];
  misc: string[];
}

export interface KanjiDTO {
  kanji: string;
  onyomi: string[];
  kunyomi: string[];
  meanings: string[];
}

export interface KanjiQuizData {
  kanji: string;
  onyomi: string[];
  kunyomi: string[];
  meanings: string[];
}

export function mapKanjiToQuizData(kanji: KanjiDTO): KanjiQuizData {
  return kanji;
}

export interface WordFeature {
  surface: string;
  features: {
    partOfSpeech: string;
    subClass1: string;
    subClass2: string;
    subClass3: string;
    inflection: string;
    conjugation: string;
    rootForm: string;
    reading: string;
    pronunciation: string;
  };
}

export const WORD_FEATURE_PROPERTIES = [
  "surface", "partOfSpeech", "subClass1", "subClass2", "subClass3",
  "inflection", "conjugation", "rootForm", "reading", "pronunciation"
];

export const WORD_FEATURE_COLUMNS = [
  "Surface", "Part of Speech", "Subclass 1", "Subclass 2", "Subclass 3",
  "Inflection", "Conjugation", "Root form", "Reading", "Pronunciation"
];

export enum SearchMode {
  Kanji = 'kanji',
  Tokenize = 'tokenize',
  VocabCards = 'vocab_cards',
  JoujouKanjis = 'jouyouKanjis',
  Combined = 'CombinedRows',
}

export function mapEntryToQuizData(entry: EntryDto) {
  const kanji = entry.kanji?.join(', ') ?? '';
  const readings = entry.readings?.join(', ') ?? '';

  const meanings  = entry.senses?.flatMap(s => s.glosses ?? []) ?? [];
  const pos       = entry.senses?.flatMap(s => s.partsOfSpeech ?? []) ?? [];
  const xrefs     = entry.senses?.flatMap(s => s.crossReferences ?? []) ?? [];
  const ants      = entry.senses?.flatMap(s => s.antonyms ?? []) ?? [];
  const misc      = entry.senses?.flatMap(s => s.misc ?? []) ?? [];

  return {
    kanji,
    readings,
    meanings,
    pos,
    crossReferences: xrefs,
    antonyms: ants,
    miscTags: misc,
    question: `What does the word "${kanji}" (${readings}) mean?`,
    info: pos.join(', ') + (misc.length ? ' — ' + misc.join(', ') : ''),
    hints: xrefs.length ? 'See also: ' + xrefs.join(', ') : '',
  };
}

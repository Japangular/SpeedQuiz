// ═══════════════════════════════════════════════════════════════
//  Dictionary entry types — matches backend EntryDto.java
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
//  Kanji dictionary types — unchanged
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
//  MeCab tokenizer types — unchanged
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
//  Search mode enum — unchanged
// ═══════════════════════════════════════════════════════════════

export enum SearchMode {
  Kanji = 'kanji',
  Tokenize = 'tokenize',
  VocabCards = 'vocab_cards',
  JoujouKanjis = 'jouyouKanjis',
  Combined = 'CombinedRows',
}

// ═══════════════════════════════════════════════════════════════
//  Entry → quiz data mapper — updated for EntryDto shape
// ═══════════════════════════════════════════════════════════════
//
//  Old version used `any` types and accessed raw JAXB field names:
//    entry.kele?.map((k: any) => k.keb)
//    entry.rele?.map((r: any) => r.reb)
//    entry.sense?.flatMap((s: any) => s.gloss)
//
//  New version is fully typed — the backend already flattened the
//  nested KElement/RElement structures into string arrays, and
//  renamed Sense fields to clean English names.

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

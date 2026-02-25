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
  //const {id, tags, metadata, ...quizData} = kanji;
  return kanji;
}

export interface Entry {
  entSeq: number;
  kEle: KElement[];
  rEle: RElement[];
  sense: Sense[];
}

export interface KElement {
  keb: string;
  keInf: string[];
  kePri: string[];
}

export interface RElement {
  reb: string;
  reInf: string[];
  rePri: string[];
}

export interface Sense {
  pos: string[];
  xref: string[];
  ant: string[];
  field: string[];
  misc: string[];
  sInf: string[];
  lsource: LSource[];
  dial: string[];
  gloss: string[];
}

export interface LSource {
  value: string;
  lang: string;
  lsType: string;
  wasei: string;
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
  "surface", "partOfSpeech", "subClass1", "subClass2", "subClass3", "inflection", "conjugation", "rootForm", "reading", "pronunciation"
]

export const WORD_FEATURE_COLUMNS = [
  "Surface", "Part of Speech", "Subclass 1", "Subclass 2", "Subclass 3", "Inflection", "Conjugation", "Root form", "Reading", "Pronunciation"
]

export enum SearchMode {
  Kanji = 'kanji',
  Tokenize = 'tokenize',
  VocabCards = 'vocab_cards',
  JoujouKanjis = 'jouyouKanjis',
  Combined = 'CombinedRows',
}

export function mapEntryToQuizData(entry: any) {
  const kanji = entry.kele?.map((k: any) => k.keb).join(", ") || "";
  const readings = entry.rele?.map((r: any) => r.reb).join(", ") || "";
  const meanings = entry.sense?.flatMap((s: any) => s.gloss) || [];
  const pos = entry.sense?.flatMap((s: any) => s.pos || []) || [];
  const xrefs = entry.sense?.flatMap((s: any) => s.xref || []) || [];
  const ants = entry.sense?.flatMap((s: any) => s.ant || []) || [];
  const misc = entry.sense?.flatMap((s: any) => s.misc || []) || [];

  return {
    kanji,
    readings,
    meanings,
    pos,
    crossReferences: xrefs,
    antonyms: ants,
    miscTags: misc,
    question: `What does the word "${kanji}" (${readings}) mean?`,
    info: pos.join(", ") + (misc.length ? " — " + misc.join(", ") : ""),
    hints: xrefs.length ? "See also: " + xrefs.join(", ") : "",
  };
}

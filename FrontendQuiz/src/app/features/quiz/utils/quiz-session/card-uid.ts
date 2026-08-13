/**
 * Stable, content-derived identity for a card.
 *
 * Decks arrive from arbitrary imported HTML tables, so there is no external
 * key to lean on. Identity therefore has to come from the card's own content:
 * the question plus the sorted set of answer values.
 *
 * Properties this buys us:
 *  - survives re-import of the same table (positions may shift, content does not)
 *  - survives any SortStrategy (progress is keyed by uid, not array position)
 *  - survives appending more rows to an existing deck
 *
 * Deliberately NOT part of the hash: level, info, hint, index. Those are
 * metadata the user may fix up later without wanting to lose their progress.
 *
 * CARD_UID_VERSION must be bumped if the normalisation or hashing below ever
 * changes, so persisted state can be detected as stale rather than silently
 * mismatching.
 */

export const CARD_UID_VERSION = 1;

/** Unit separator — safe joiner, will not occur in deck content. */
const FIELD_SEP = '\u241F';
/** Record separator. */
const PART_SEP = '\u241E';

/**
 * Whitespace and Unicode form are the two things that differ between two
 * copies of the same table scraped from different pages, so both are flattened.
 * NFC (not NFKC) on purpose: NFKC folds half-width katakana into full-width,
 * which is a real content difference for a Japanese deck.
 */
function normalize(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ');
}

/** FNV-1a, 32-bit, with a configurable offset basis. */
function fnv1a(input: string, seed: number): number {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * 64 bits as hex. Two independently seeded 32-bit passes rather than one,
 * because a single 32-bit space gives roughly a 1-in-1000 collision chance
 * across a 3000-card deck. Genuine duplicates (and the rare collision) are
 * disambiguated by buildDeck(), so this only needs to be good, not perfect.
 */
export function cardUid(question: string, answers: Record<string, string>): string {
  const answerPart = Object.values(answers)
    .map(normalize)
    .filter(value => value.length > 0)
    .sort()
    .join(FIELD_SEP);

  const payload = `${normalize(question)}${PART_SEP}${answerPart}`;

  const a = fnv1a(payload, 0x811c9dc5);
  const b = fnv1a(payload, 0x9e3779b9);

  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}

/**
 * Parses pasted text into rows of cards.
 *
 * Supports two formats:
 * 1. Tab-separated: each line is a card, columns separated by tabs
 * 2. Newline-grouped: every N lines is one card (e.g., kanji / reading / meaning)
 *
 * Auto-detects which format based on tab presence, then applies
 * user-adjustable skipLines and columnsPerCard.
 */

export type DetectedDelimiter = 'tab' | 'newline-group';

export interface ParseResult {
  rows: string[][];
  detectedDelimiter: DetectedDelimiter;
  columnsPerCard: number;
  skipLines: number;
  columnHeaders: string[];
}

export interface ParseOptions {
  skipLines?: number;
  columnsPerCard?: number;
}

export function parsePastedText(raw: string, options?: ParseOptions): ParseResult {
  const lines = raw.split('\n').map(l => l.trimEnd()).filter(l => l.length > 0);

  if (lines.length === 0) {
    return {rows: [], detectedDelimiter: 'tab', columnsPerCard: 0, skipLines: 0, columnHeaders: []};
  }

  const tabCount = lines.filter(l => l.includes('\t')).length;
  const isTabSeparated = tabCount > lines.length * 0.4;

  if (isTabSeparated) {
    return parseTabSeparated(lines, options);
  } else {
    return parseNewlineGrouped(lines, options);
  }
}

function parseTabSeparated(lines: string[], options?: ParseOptions): ParseResult {
  const skip = options?.skipLines ?? detectSkipLines(lines, 'tab');
  const dataLines = lines.slice(skip);
  const rows = dataLines.map(l => l.split('\t').map(c => c.trim()));
  const maxCols = Math.max(...rows.map(r => r.length));

  // Pad short rows
  const paddedRows = rows.map(r => {
    while (r.length < maxCols) r.push('');
    return r;
  });

  return {
    rows: paddedRows,
    detectedDelimiter: 'tab',
    columnsPerCard: maxCols,
    skipLines: skip,
    columnHeaders: guessHeaders(maxCols, paddedRows),
  };
}

function parseNewlineGrouped(lines: string[], options?: ParseOptions): ParseResult {
  const colsPerCard = options?.columnsPerCard ?? detectColumnsPerCard(lines);
  const skip = options?.skipLines ?? detectSkipLines(lines, 'newline-group', colsPerCard);
  const dataLines = lines.slice(skip);

  const rows: string[][] = [];
  for (let i = 0; i + colsPerCard <= dataLines.length; i += colsPerCard) {
    rows.push(dataLines.slice(i, i + colsPerCard));
  }

  return {
    rows,
    detectedDelimiter: 'newline-group',
    columnsPerCard: colsPerCard,
    skipLines: skip,
    columnHeaders: guessHeaders(colsPerCard, rows),
  };
}

/**
 * Tries to detect how many lines make up one card by looking for
 * repeating character-type patterns.
 *
 * E.g., [kanji, kana, latin, kanji, kana, latin, ...] → 3
 */
function detectColumnsPerCard(lines: string[]): number {
  const types = lines.map(classifyLine);

  for (const n of [3, 2, 4, 5]) {
    if (types.length < n * 2) continue;

    // Check if the pattern of the first group repeats
    const pattern = types.slice(0, n);
    let matches = 0;
    const groupsToCheck = Math.min(5, Math.floor(types.length / n));

    for (let g = 1; g < groupsToCheck; g++) {
      const group = types.slice(g * n, g * n + n);
      if (group.every((t, i) => t === pattern[i])) matches++;
    }

    if (matches >= groupsToCheck - 1) return n;
  }

  return 3; // safe default for Japanese study cards
}

type LineType = 'cjk' | 'kana' | 'latin' | 'mixed' | 'short';

function classifyLine(line: string): LineType {
  if (line.length <= 2) return 'short';

  const cjk = [...line].filter(c => c >= '\u4e00' && c <= '\u9fff').length;
  const kana = [...line].filter(c =>
    (c >= '\u3040' && c <= '\u309f') || (c >= '\u30a0' && c <= '\u30ff')
  ).length;
  const latin = [...line].filter(c => /[a-zA-Z]/.test(c)).length;
  const total = line.replace(/\s/g, '').length || 1;

  if (cjk / total > 0.5) return 'cjk';
  if (kana / total > 0.5) return 'kana';
  if (latin / total > 0.5) return 'latin';
  return 'mixed';
}

/**
 * Detects how many initial lines to skip (headers, section labels, etc.)
 */
function detectSkipLines(lines: string[], delimiter: DetectedDelimiter, colsPerCard?: number): number {
  if (delimiter === 'tab') {
    // For tab-separated, first line might be a header row
    if (lines.length < 2) return 0;
    const firstRowType = classifyLine(lines[0]);
    const secondRowType = classifyLine(lines[1]);
    // If first line is all latin and second has CJK, first is probably a header
    if (firstRowType === 'latin' && secondRowType !== 'latin') return 1;
    return 0;
  }

  // For newline-grouped, skip lines until the repeating pattern starts
  const n = colsPerCard ?? 3;
  const types = lines.map(classifyLine);

  // Look for the first position where a consistent pattern starts
  for (let skip = 0; skip <= Math.min(5, lines.length - n); skip++) {
    const pattern = types.slice(skip, skip + n);
    // Check next group matches
    if (skip + n * 2 <= types.length) {
      const nextGroup = types.slice(skip + n, skip + n * 2);
      if (nextGroup.every((t, i) => t === pattern[i])) {
        return skip;
      }
    }
  }

  return 0;
}

/**
 * Guesses column headers based on content patterns.
 */
function guessHeaders(columnCount: number, sampleRows: string[][]): string[] {
  if (sampleRows.length === 0 || columnCount === 0) return [];

  const headers: string[] = [];

  for (let col = 0; col < columnCount; col++) {
    const samples = sampleRows.slice(0, 5).map(r => r[col] ?? '');
    const type = classifyLine(samples.join(' '));

    if (type === 'cjk' || type === 'mixed') {
      headers.push(headers.some(h => h === 'Kanji') ? `Column ${col + 1}` : 'Kanji');
    } else if (type === 'kana') {
      headers.push('Reading');
    } else if (type === 'latin') {
      headers.push(headers.some(h => h === 'Meaning') ? `Column ${col + 1}` : 'Meaning');
    } else {
      headers.push(`Column ${col + 1}`);
    }
  }

  return headers;
}

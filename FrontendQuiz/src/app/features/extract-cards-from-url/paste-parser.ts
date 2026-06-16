export type DetectedDelimiter = 'tab' | 'newline-group';
export type ColumnRole = 'question' | 'answer' | 'hiragana' | 'skip';

export interface ParseResult {
  rows: string[][];
  detectedDelimiter: DetectedDelimiter;
  columnsPerCard: number;
  skipLines: number;
  columnHeaders: string[];
  columnTypes: LineType[];
  suggestedRoles: ColumnRole[];
  rowLevels: number[];   // parallel to rows: the level each card belongs to
  hasLevels: boolean;    // true when "Level N" headers were detected
}

export interface ParseOptions {
  skipLines?: number;
  columnsPerCard?: number;
}

/** WaniKani-style section header, e.g. "Level 3 (31/31 unlocked)". */
const LEVEL_HEADER = /^(?:level|lvl|レベル)\s*[:#]?\s*(\d+)/i;

interface LeveledLines {
  lines: string[];        // content lines, header lines removed
  lineLevels: number[];   // parallel to lines: the level in force for that line
  hasLevels: boolean;
}

/**
 * Removes "Level N" header lines and records the level that applies to every
 * following content line. A card inherits the level of its first line.
 */
function extractLevels(rawLines: string[]): LeveledLines {
  const lines: string[] = [];
  const lineLevels: number[] = [];
  let current = 1;
  let hasLevels = false;

  for (const line of rawLines) {
    const m = line.match(LEVEL_HEADER);
    if (m) {
      current = parseInt(m[1], 10);
      hasLevels = true;
      continue;              // drop the header itself
    }
    lines.push(line);
    lineLevels.push(current);
  }

  return {lines, lineLevels, hasLevels};
}

const EMPTY: ParseResult = {
  rows: [], detectedDelimiter: 'tab', columnsPerCard: 0, skipLines: 0,
  columnHeaders: [], columnTypes: [], suggestedRoles: [], rowLevels: [], hasLevels: false,
};

export function parsePastedText(raw: string, options?: ParseOptions): ParseResult {
  const rawLines = raw.split('\n').map(l => l.trimEnd()).filter(l => l.length > 0);
  if (rawLines.length === 0) return {...EMPTY};

  const {lines, lineLevels, hasLevels} = extractLevels(rawLines);
  if (lines.length === 0) return {...EMPTY, hasLevels};

  const tabCount = lines.filter(l => l.includes('\t')).length;
  const isTabSeparated = tabCount > lines.length * 0.4;

  const result = isTabSeparated
    ? parseTabSeparated(lines, lineLevels, options)
    : parseNewlineGrouped(lines, lineLevels, options);

  result.hasLevels = hasLevels;
  return result;
}

function parseTabSeparated(lines: string[], lineLevels: number[], options?: ParseOptions): ParseResult {
  const skip = options?.skipLines ?? detectSkipLines(lines, 'tab');
  const dataLines = lines.slice(skip);
  const rows = dataLines.map(l => l.split('\t').map(c => c.trim()));
  const rowLevels = dataLines.map((_, i) => lineLevels[skip + i] ?? 1);
  const maxCols = Math.max(...rows.map(r => r.length));

  const paddedRows = rows.map(r => {
    while (r.length < maxCols) r.push('');
    return r;
  });

  const columnTypes = detectColumnTypes(maxCols, paddedRows);
  const columnHeaders = buildHeaders(columnTypes);

  return {
    rows: paddedRows,
    detectedDelimiter: 'tab',
    columnsPerCard: maxCols,
    skipLines: skip,
    columnHeaders,
    columnTypes,
    suggestedRoles: suggestRoles(columnTypes),
    rowLevels,
    hasLevels: false,
  };
}

function parseNewlineGrouped(lines: string[], lineLevels: number[], options?: ParseOptions): ParseResult {
  const colsPerCard = options?.columnsPerCard ?? detectColumnsPerCard(lines);
  const skip = options?.skipLines ?? detectSkipLines(lines, 'newline-group', colsPerCard);
  const dataLines = lines.slice(skip);

  const rows: string[][] = [];
  const rowLevels: number[] = [];
  for (let i = 0; i + colsPerCard <= dataLines.length; i += colsPerCard) {
    rows.push(dataLines.slice(i, i + colsPerCard));
    rowLevels.push(lineLevels[skip + i] ?? 1);   // level of the card's first line
  }

  const columnTypes = detectColumnTypes(colsPerCard, rows);
  const columnHeaders = buildHeaders(columnTypes);

  return {
    rows,
    detectedDelimiter: 'newline-group',
    columnsPerCard: colsPerCard,
    skipLines: skip,
    columnHeaders,
    columnTypes,
    suggestedRoles: suggestRoles(columnTypes),
    rowLevels,
    hasLevels: false,
  };
}

export type LineType = 'cjk' | 'kana' | 'latin' | 'mixed' | 'short';

function detectColumnTypes(columnCount: number, sampleRows: string[][]): LineType[] {
  const types: LineType[] = [];

  for (let col = 0; col < columnCount; col++) {
    const samples = sampleRows.slice(0, 8).map(r => r[col] ?? '');
    types.push(classifyColumn(samples));
  }
  return types;
}

function classifyColumn(samples: string[]): LineType {
  const votes = samples.map(classifyLine);
  const counts: Record<string, number> = {};
  for (const v of votes) {
    counts[v] = (counts[v] ?? 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as LineType ?? 'mixed';
}

function classifyLine(line: string): LineType {

  const chars = [...line.replace(/\s/g, '')];
  const total = chars.length || 1;

  const cjk = chars.filter(c => c >= '\u4e00' && c <= '\u9fff').length;
  const kana = chars.filter(c =>
    (c >= '\u3040' && c <= '\u309f') || (c >= '\u30a0' && c <= '\u30ff')
  ).length;
  const latin = chars.filter(c => /[a-zA-Z]/.test(c)).length;

  if (cjk / total > 0.4) return 'cjk';
  if (kana / total > 0.4) return 'kana';
  if (latin / total > 0.4) return 'latin';
  return 'mixed';
}

function suggestRoles(types: LineType[]): ColumnRole[] {
  const questionPriority: LineType[] = ['cjk', 'short', 'mixed', 'kana', 'latin'];

  let questionIndex = -1;

  for (const preferred of questionPriority) {
    const idx = types.indexOf(preferred);
    if (idx >= 0) {
      questionIndex = idx;
      break;
    }
  }

  if (questionIndex < 0) questionIndex = 0;

  return types.map((_, i) => i === questionIndex ? 'question' : 'answer');
}

function buildHeaders(types: LineType[]): string[] {
  const usedNames = new Set<string>();

  return types.map(type => {
    let name: string;
    switch (type) {
      case 'cjk':
        name = usedNames.has('Kanji') ? 'Kanji/Vocab' : 'Kanji';
        break;
      case 'kana':
        name = usedNames.has('Reading') ? 'Kana' : 'Hiragana';
        break;
      case 'latin':
        name = usedNames.has('Meaning') ? 'English' : 'Meaning';
        break;
      case 'short':
        name = usedNames.has('Kanji') ? 'Hiragana' : 'Kanji';
        break;
      default:
        name = `Column ${usedNames.size + 1}`;
    }
    usedNames.add(name);
    return name;
  });
}

function detectColumnsPerCard(lines: string[]): number {
  const types = lines.map(classifyLine);

  for (const n of [3, 2, 4, 5]) {
    if (types.length < n * 2) continue;

    const pattern = types.slice(0, n);
    let matches = 0;
    const groupsToCheck = Math.min(5, Math.floor(types.length / n));

    for (let g = 1; g < groupsToCheck; g++) {
      const group = types.slice(g * n, g * n + n);
      if (group.every((t, i) => t === pattern[i])) matches++;
    }

    if (matches >= groupsToCheck - 1) return n;
  }

  return 3;
}

function detectSkipLines(lines: string[], delimiter: DetectedDelimiter, colsPerCard?: number): number {
  if (delimiter === 'tab') {
    if (lines.length < 2) return 0;
    const firstRowType = classifyLine(lines[0]);
    const secondRowType = classifyLine(lines[1]);
    if (firstRowType === 'latin' && secondRowType !== 'latin') return 1;
    return 0;
  }

  const n = colsPerCard ?? 3;
  const types = lines.map(classifyLine);

  for (let skip = 0; skip <= Math.min(5, lines.length - n); skip++) {
    const pattern = types.slice(skip, skip + n);
    if (skip + n * 2 <= types.length) {
      const nextGroup = types.slice(skip + n, skip + n * 2);
      if (nextGroup.every((t, i) => t === pattern[i])) {
        return skip;
      }
    }
  }

  return 0;
}

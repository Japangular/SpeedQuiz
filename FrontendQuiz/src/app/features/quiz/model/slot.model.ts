export type SlotRole = 'display' | 'answer';
export type RenderHint = 'text' | 'image' | 'kanji' | 'stroke-order' | 'choice';

export interface Slot {
  value: string;
  role: SlotRole;
  renderHint?: RenderHint;
  fieldName?: string;
  choices?: string[];
}

const IMAGE_PATTERN = /\.(png|jpg|jpeg|gif|svg|webp)(\?.*)?$/i;
const CJK_PATTERN = /[\u3400-\u4DBF\u4E00-\u9FFF]/;
const KANA_PATTERN = /^[\u3040-\u309F\u30A0-\u30FF]+$/;

export function detectRenderHint(value: string): RenderHint {
  if (IMAGE_PATTERN.test(value)) return 'image';
  if (CJK_PATTERN.test(value) && value.length <= 4) return 'kanji';
  return 'text';
}


export interface QuizMode {
  name: string;
  questionFields: string[];
  answerFields: string[];
  revealOrder?: string[];
  penaltyFn?: (currentIndex: number) => number;
  batchSize?: number;
}

export function buildSlots(
  fields: Record<string, string>,
  mode: QuizMode,
): Slot[] {
  const slots: Slot[] = [];

  // Display slots (the question)
  for (const key of mode.questionFields) {
    const value = fields[key];
    if (value) {
      slots.push({
        value,
        role: 'display',
        renderHint: detectRenderHint(value),
        fieldName: key,
      });
    }
  }

  for (const key of mode.answerFields) {
    const value = fields[key];
    if (value) {
      slots.push({
        value,
        role: 'answer',
        renderHint: detectRenderHint(value),
        fieldName: key,
      });
    }
  }

  return slots;
}

export function inferDefaultMode(
  properties: Record<string, string>
): QuizMode {
  const questionFields: string[] = [];
  const answerFields: string[] = [];

  for (const [key, role] of Object.entries(properties)) {
    if (role === 'question') questionFields.push(key);
    else if (role === 'answer') answerFields.push(key);
    // hint, info, etc. are ignored by the quiz engine
  }

  return {
    name: 'classic',
    questionFields,
    answerFields,
  };
}

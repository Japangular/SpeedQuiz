export interface SelectedQuizEvent {

}

export function hasKanji(str: string): boolean {
  return /[\u3400-\u4DBF\u4E00-\u9FFF]/.test(str);
}

export function isKanjiString(str: string): boolean {
  return /^[\u3400-\u4DBF\u4E00-\u9FFF]+$/.test(str);
}

export function isKanji(char: string): boolean {
  return /^[\u3400-\u4DBF\u4E00-\u9FFF]$/.test(char);
}

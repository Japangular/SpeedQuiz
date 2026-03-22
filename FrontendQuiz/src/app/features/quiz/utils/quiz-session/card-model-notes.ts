import {Card} from '../../answer-slots/quiz.model';
import {SubmissionDeck} from '../../../../models/deck.model';
import {PropertyType} from '../../../../../generated/api';

export interface ExtendedCard extends Card {
  image?: string;
  svg?: string;
  audio?: string;
  hiragana?: string;
  answerList?: string[];
}

export function mapDeckExtended(deck: SubmissionDeck): ExtendedCard[] {
  const byType = (type: PropertyType) =>
    Object.entries(deck.properties).filter(([_, v]) => v === type).map(([key]) => key);

  const questionKeys = byType(PropertyType.Question);
  const answerKeys = byType(PropertyType.Answer);
  const hintKeys = byType(PropertyType.Hint);
  const imageKeys = byType(PropertyType.Image);
  const svgKeys = byType(PropertyType.Svg);
  const audioKeys = byType(PropertyType.Audio);
  const hiraganaKeys = byType(PropertyType.Hiragana);
  const answerListKeys = byType(PropertyType.AnswerList);
  const infoKeys = byType(PropertyType.Info);

  const firstQuestionKey = questionKeys[0];

  return deck.cards.map((c, index) => {
    // Answers
    const answers: Record<string, string> = {};
    for (const key of answerKeys) {
      if (c[key] !== undefined) answers[key] = c[key];
    }

    const foundHintKey = hintKeys.find(key => c[key] !== undefined);
    const hint = foundHintKey ? c[foundHintKey] : `${c[firstQuestionKey]} → ${Object.values(answers).join(', ')}`;

    const usedKeys = new Set([...questionKeys, ...answerKeys, ...hintKeys, ...imageKeys, ...svgKeys, ...audioKeys, ...hiraganaKeys, ...answerListKeys]);
    const info = infoKeys.filter(key => c[key] !== undefined).map(key => `${key}: ${c[key]}`).join(', ') || `Card ${index}`;

    const image = imageKeys.find(k => c[k] !== undefined) ? c[imageKeys[0]] : undefined;
    const svg = svgKeys.find(k => c[k] !== undefined) ? c[svgKeys[0]] : undefined;
    const audio = audioKeys.find(k => c[k] !== undefined) ? c[audioKeys[0]] : undefined;
    const hiragana = hiraganaKeys.find(k => c[k] !== undefined) ? c[hiraganaKeys[0]] : undefined;
    const answerList = answerListKeys.find(k => c[k] !== undefined)
      ? c[answerListKeys[0]].split(',').map((s: string) => s.trim()) : undefined;

    return {
      index, level: index, subjectType: 'other', question: firstQuestionKey ? c[firstQuestionKey] : 'No question', answers, hint, info,
      subjectId: index, image, svg, audio, hiragana, answerList,} as ExtendedCard;});
}

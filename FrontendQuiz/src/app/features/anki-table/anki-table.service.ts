import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {AnkiCard, AnkiPage, AnkiPageInfo, UserTableStates} from './anki-table.model';
import {QuizBoardService} from '../quiz/quiz-board/quiz-board.service';
import {AnkiSourceService} from './anki-source.service';
import {DeckStore} from '../../store/deck.store';
import {PropertyType} from '../../../generated/api';

@Injectable()
export class AnkiTableService {
  private deckStore = inject(DeckStore);
  constructor(private sourceService: AnkiSourceService) {}

  learnSelected(ankiCards: AnkiCard[]) {
    if (!ankiCards || ankiCards.length === 0) return;

    const properties: Record<string, PropertyType> = {
      index: PropertyType.Info,
      question: PropertyType.Question,
      reading: PropertyType.Answer,
      meaning: PropertyType.Answer,
      hint: PropertyType.Hint,
    };

    const cards = ankiCards.map(card => ({
      index: card.index,
      question: card.question,
      reading: card.reading,
      meaning: card.meaning,
      hint: [card.index, card.question, card.reading, card.meaning].join(' : '),
    }));

    this.deckStore.loadDeck({ properties, cards }, 'SelectedAnkiDeck');
  }

  persistIgnoredAnkiRows(rowIds: string[]): Observable<string>{
    console.log(rowIds);
    return this.sourceService.persistIgnoredAnkiRows(rowIds);
  }

  getIgnoredAnkiRows(): Observable<UserTableStates> {
    return this.sourceService.getIgnoredAnkiRows();
  }

  applyQuestionFilter(charOrWord: string) {

  }

  getPage(limit: number = 10, offset: number = 0, questionFilter = ""): Observable<AnkiPage> {
    return this.sourceService.getPage(limit, offset, questionFilter);
  }

  getTotal(): Observable<AnkiPageInfo> {
    return this.sourceService.getTotal();
  }
}

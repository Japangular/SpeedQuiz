import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {AnkiCard, AnkiPage, AnkiPageInfo, UserTableStates} from './anki-table.model';
import {QuizBoardService} from '../quiz/quiz-board/quiz-board.service';
import {AnkiSourceService} from './anki-source.service';

@Injectable()
export class AnkiTableService {

  constructor(private sourceService: AnkiSourceService, private quizBoardService: QuizBoardService) {
  }

  getPage(limit: number = 10, offset: number = 0, questionFilter = ""): Observable<AnkiPage> {
    return this.sourceService.getPage(limit, offset, questionFilter);
  }

  getTotal(): Observable<AnkiPageInfo> {
    return this.sourceService.getTotal();
  }

  learnSelected(ankiCards: AnkiCard[]){
    if (!ankiCards || ankiCards.length == 0)
      return;
    this.quizBoardService.learnSelected(ankiCards);
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
}

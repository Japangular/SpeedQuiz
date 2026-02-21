import {Observable} from 'rxjs';
import {AnkiPage, AnkiPageInfo, UserTableStates} from './anki-table.model';

export abstract class AnkiSourceService {
  abstract getPage(limit: number, offset: number, questionFilter: string): Observable<AnkiPage>;
  abstract getTotal(): Observable<AnkiPageInfo>;
  abstract persistIgnoredAnkiRows(rowIds: string[]): Observable<string>;
  abstract getIgnoredAnkiRows(): Observable<UserTableStates>;
}

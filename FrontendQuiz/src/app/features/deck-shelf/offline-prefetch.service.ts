import {inject, Injectable} from '@angular/core';
import {DeckShelfService} from './deck-shelf.service';
import {catchError, concatMap, from, Observable, of} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class OfflinePrefetchService {
  private shelf = inject(DeckShelfService);

  /** Walks every deck once so the service worker caches each response. */
  prefetchAll(): Observable<{done: number; total: number}> {
    return this.shelf.getDeckOverview().pipe(
      switchMap(decks =>
        from(decks).pipe(
          concatMap((d, i) =>
            this.shelf.loadDeck(d.id).pipe(
              catchError(() => of(null)),
              map(() => ({done: i + 1, total: decks.length})),
            )),
        )),
    );
  }
}

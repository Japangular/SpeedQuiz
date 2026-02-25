import {Injectable, signal} from '@angular/core';
import {JapaneseDictService} from '../features/dict/japanese-dict/japanese-dict.service';
import {Entry, KanjiDTO, SearchMode} from '../features/dict/japanese-dict/japanese-dict.model';
import {catchError, Observable, of} from 'rxjs';
import {map, tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DictStateService {

// Signal-based reactive state

  kanjiResults = signal<any[]>([]);
  tokenizeResults = signal<any[]>([]);
  jouyouKanjis = signal<KanjiDTO[]>([]);

  selectedOption = signal<SearchMode>(SearchMode.Kanji);
  searchTerm = signal<string>('火');
  private jouyouKanjisLoaded = false;

  constructor(private dictionaryService: JapaneseDictService) {
  }

  search(selectedOption: SearchMode, query: string) {
    switch (selectedOption) {
      case SearchMode.Kanji:
      case SearchMode.Tokenize:
        this.searchKanji(query);
        this.tokenizeText(query);
        break;

      case SearchMode.VocabCards:
        this.generateVocabCards();
        break;

      case SearchMode.JoujouKanjis:
        this.parseJouyouKanjis();
        break;

      default:
        console.warn('Invalid search mode selected:', selectedOption);
        break;
    }
  }

  tokenizeText(searchTerm: string) {
    this.dictionaryService.searchMecab(searchTerm).subscribe(tokens => {
      const tokenizeResults = tokens.map(token => {
        const {surface, features} = token;
        return {
          surface,
          ...features
        };
      });

      this.tokenizeResults.set(tokenizeResults);
    });
  }

  generateVocabCards() {

  }

  parseJouyouKanjis(): Observable<boolean> {
    if (!this.jouyouKanjisLoaded) {
      return this.dictionaryService.jouyouKanjis().pipe(
        tap(kanjis => {
          this.jouyouKanjis.set(kanjis);
          this.jouyouKanjisLoaded = true;
        }),
        map(() => true),
        catchError(() => {
          // Optionally: set the flag to avoid infinite retries, or leave it false to allow retries
          this.jouyouKanjisLoaded = true;
          return of(false);
        })
      );
    } else {
      return of(true);
    }
  }


  jouyou(){
    return this.jouyouKanjis();
  }

  searchKanji(searchTerm: string) {
    this.dictionaryService.searchKanji(searchTerm).subscribe({
      next: (data: KanjiDTO[]) => {
        console.log("number of kanji received: " + data.length);
        this.kanjiResults.set(data);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}

export const initialDictState = {

}

export interface DictState {
  entryResult: Entry[];
  kanjiResults: any[];
}

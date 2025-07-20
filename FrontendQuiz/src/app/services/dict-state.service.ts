import {Injectable, signal} from '@angular/core';
import {Entry, KanjiDTO, SearchMode} from '../dict/japanese-dict/japanese-dict.model';
import {JapaneseDictService} from '../dict/japanese-dict/japanese-dict.service';

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

  constructor(private dictionaryService: JapaneseDictService) {
  }

  search(selectedOption: SearchMode, query: string) {
    switch (selectedOption) {
      case SearchMode.Kanji:
        this.searchKanji(query);
        break;

      case SearchMode.Tokenize:
        console.log("tokenize");
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

  parseJouyouKanjis() {
    if (this.jouyouKanjis.length === 0) {
      this.dictionaryService.jouyouKanjis().subscribe(kanjis => this.jouyouKanjis.set(kanjis));
    }
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

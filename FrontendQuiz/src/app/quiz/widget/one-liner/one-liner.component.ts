import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Subscription} from 'rxjs';
import {NgForOf} from "@angular/common";
import {Card} from '../../dualInputCard/quiz.model';

@Component({
  selector: 'app-one-liner',
  standalone: true,
  imports: [
    NgForOf
  ],
  templateUrl: './one-liner.component.html',
  styleUrls: ['./one-liner.component.css']
})
export class OneLinerComponent {

  @Input()
  type: 'info' | 'hint' | 'question' = "question";

  @Input()
  set card(card: Card) {
    if (card) {
      this.displayText = this.type === 'hint' ? card.hint : this.type === 'info' ? card.info : card.question;
      if (card.subjectType.toLowerCase() === 'kanji' || card.subjectType.toLowerCase() === 'vocabulary') {
        this._isVisible = false;
      }
    }
  }

  @Output()
  emitSelectedSubKanji: EventEmitter<SelectedSubKanji> = new EventEmitter<SelectedSubKanji>();

  displayText: string = "";


  private subscription!: Subscription;
  _isVisible = true;

  constructor() {
  }

  isVisible(): boolean{
    return this._isVisible
  }

  // Optionally, split the displayText into an array of characters
  get characters() {
    return Array.from(this.displayText);
  }

  // Function to handle clicks on individual characters
  onCharacterClick(character: string, index: number) {
    const  selectedSubKanji: SelectedSubKanji = {character: character, characterPosition: index, isSelected: true, displayedText: this.displayText} as SelectedSubKanji;
    const kanjiRegex = /^[\u4e00-\u9faf\u3400-\u4dbf]$/;
    if(!kanjiRegex.test(character)){
      return;
    }
    const max = index;
    for(let i = 0; i <= max; i++){
      if(!kanjiRegex.test(this.displayText.charAt(i))){
        selectedSubKanji.characterPosition--;
      }
    }
    this.emitSelectedSubKanji.emit(selectedSubKanji);
  }
}

export interface SelectedSubKanji {
  character: string;
  characterPosition: number;
  isSelected: boolean;
  displayedText: string;
  card?: Card;
}


function filterKanjis(input: string): string {
  // Regular expression to match all kanji characters
  const kanjiRegex = /[\u4e00-\u9faf\u3400-\u4dbf]/g;

  // Use match to find all kanji characters
  const kanjiCharacters = input.match(kanjiRegex);

  // If there are matches, join them into a single string; otherwise, return an empty string
  return kanjiCharacters ? kanjiCharacters.join('') : '';
}

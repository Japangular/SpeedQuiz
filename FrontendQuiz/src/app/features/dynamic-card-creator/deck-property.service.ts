import {Injectable} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BehaviorSubject, Observable} from 'rxjs';
import {PropertyType} from './submission-deck.model';

@Injectable({
  providedIn: 'root'
})
export class DeckPropertyService {
  _currentDynamicDeck!: BehaviorSubject<DynamicDeck>;
  currentDynamicDeck$!: Observable<DynamicDeck>;

  constructor(private fb: FormBuilder) {
    this.createDeckForm();
  }

  createDeckForm(): void {
    const deckForm = this.fb.group({
      deckName: ['', Validators.required],
      properties: this.fb.array([]),
      cards: this.fb.array([]),
    });
    this._currentDynamicDeck = new BehaviorSubject<DynamicDeck>(new DynamicDeck(deckForm));
    this.currentDynamicDeck$ = this._currentDynamicDeck.asObservable();
  }

  nextDynamicDeck(dynamicDeck: DynamicDeck){
    this._currentDynamicDeck.next(dynamicDeck);
  }

}

export class DynamicDeck {
  displayedColumns: string[] = [];
  currentStep: number = 0;
  cards: { name: PropertyType; value: string }[] = [];
  propertyTypes: { [key: string]: PropertyType } = {};
  username = "app initializer";
  constructor(public deckForm: FormGroup){}
}

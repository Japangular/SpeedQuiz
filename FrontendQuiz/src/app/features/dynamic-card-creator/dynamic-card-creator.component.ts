import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatStep, MatStepper} from '@angular/material/stepper';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {MatChip} from '@angular/material/chips';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from '@angular/material/table';
import {MatButton} from '@angular/material/button';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {CardStoreService} from '../../services/card-store.service';
import {PropertyType} from './submission-deck.model';
import {DeckPropertyService, DynamicDeck} from './deck-property.service';
import {take} from 'rxjs';

@Component({
  selector: 'app-dynamic-card-creator',
  templateUrl: './dynamic-card-creator.component.html',
  styleUrls: ['./dynamic-card-creator.component.scss'],
  imports: [
    MatStepper,
    MatStep,
    MatFormField,
    NgForOf,
    MatChip,
    ReactiveFormsModule,
    TitleCasePipe,
    MatTable,
    MatHeaderCell,
    MatCell,
    MatHeaderRow,
    MatRow,
    MatRowDef,
    MatHeaderRowDef,
    MatHeaderCellDef,
    MatCellDef,
    MatButton,
    MatInput,
    MatColumnDef,
    MatLabel,
    MatError,
    NgIf,
    FormsModule,
    MatSelect,
    MatOption,
  ],
  standalone: true,
})
export class DynamicCardCreatorComponent implements OnInit {
  dynamicDeck!: DynamicDeck;
  @ViewChild('propertyInput') propertyInput!: ElementRef;

  constructor(private fb: FormBuilder, private submissionService: CardStoreService, private deckProperty: DeckPropertyService) {
  }

  ngOnInit(): void {
    this.deckProperty.currentDynamicDeck$.pipe(take(1)).subscribe(dynamicDeck => {
      this.dynamicDeck = dynamicDeck;
    });
  }

  get properties(): FormArray {
    return (this.dynamicDeck.deckForm.get('properties') as FormArray);
  }

  addProperty(propertyName: string): void {
    if (propertyName && !this.properties.value.includes(propertyName)) {
      this.properties.push(this.fb.control(propertyName));
      this.dynamicDeck.displayedColumns.push(propertyName);
      (this.dynamicDeck.deckForm as FormGroup).addControl(propertyName, this.fb.control(''));
      this.deckProperty.nextDynamicDeck(this.dynamicDeck);
    }
  }

  deleteProperty(index: number): void {
    const propertyName = this.properties.at(index).value;

    // Remove from FormArray
    this.properties.removeAt(index);

    // Remove from displayedColumns (for the table or UI display)
    const columnIndex = this.dynamicDeck.displayedColumns.indexOf(propertyName);
    if (columnIndex !== -1) {
      this.dynamicDeck.displayedColumns.splice(columnIndex, 1);
    }

    // Remove from deckForm (remove the form control for the property)
    (this.dynamicDeck.deckForm as FormGroup).removeControl(propertyName);

    // Notify the dynamic deck of the updated columns
    this.deckProperty.nextDynamicDeck(this.dynamicDeck);
  }

  setPropertyType(propertyName: string, type: PropertyType): void {
    this.dynamicDeck.propertyTypes[propertyName] = type;
    this.deckProperty.nextDynamicDeck(this.dynamicDeck);
  }

  addCard(): void {
    if (this.dynamicDeck.deckForm.invalid) {
      return;
    }

    const cardData: any = {};

    this.properties.controls.forEach((propertyControl) => {
      const propertyName = propertyControl.value;
      cardData[propertyName] = this.dynamicDeck.deckForm.get(propertyName)?.value || '';
    });

    this.dynamicDeck.cards.push(cardData);
    this.dynamicDeck.cards = [...this.dynamicDeck.cards];
    this.deckProperty.nextDynamicDeck(this.dynamicDeck);
    this.resetCardForm();
  }

  resetCardForm(): void {
    this.properties.controls.forEach((propertyControl) => {
      const propertyName = propertyControl.value;
      this.dynamicDeck.deckForm.get(propertyName)?.reset('');
      this.deckProperty.nextDynamicDeck(this.dynamicDeck)
    });
  }

  onCardSubmit(): void {
    this.submissionService.sendUserGeneratedDeck({
      deckName: this.dynamicDeck.deckForm.get('deckName')?.value,
      username: this.dynamicDeck.username,
      properties: this.dynamicDeck.propertyTypes,
      cards: this.dynamicDeck.cards
    });
  }

  clearPropertyInput(): void {
    // Reset the specific property input field when the label is clicked
    const propertyInputControl = this.dynamicDeck.deckForm.get('propertyName'); // adjust to the actual form control name
    if (propertyInputControl) {
      propertyInputControl.setValue('');
    }
  }

  clearInput(inputField: HTMLInputElement): void {
    inputField.value = ''; // Reset the value of the field directly
  }

  nextStep(step: number): void {
    this.dynamicDeck.currentStep = step;
  }

  get currentStep(): number {
    return this.dynamicDeck?.currentStep || 0;
  }

  set currentStep(value: number) {
    if (this.dynamicDeck) {
      this.dynamicDeck.currentStep = value;
      this.deckProperty.nextDynamicDeck(this.dynamicDeck);
    }
  }

  deckForm(): FormGroup{
    return this.dynamicDeck.deckForm;
  }

  displayedColumns(): string[]{
    return this.dynamicDeck.displayedColumns
  }

  propertyTypes(): { [key: string]: PropertyType } {
    return this.dynamicDeck.propertyTypes;
  }

  cards(){
    return this.dynamicDeck.cards;
  }
}

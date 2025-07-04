import {Component, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
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
  deckForm!: FormGroup;
  displayedColumns: string[] = [];
  currentStep: number = 0;
  cards: { name: PropertyType; value: string }[] = [];
  propertyTypes: { [key: string]: PropertyType } = {};
  username = "app initializer";

  constructor(private fb: FormBuilder, private submissionService: CardStoreService) {
  }

  ngOnInit(): void {
    this.deckForm = this.fb.group({
      deckName: ['', Validators.required],
      properties: this.fb.array([]),
      cards: this.fb.array([]),
    });
  }

  get properties(): FormArray {
    return (this.deckForm.get('properties') as FormArray);
  }

  addProperty(propertyName: string): void {
    if (propertyName && !this.properties.value.includes(propertyName)) {
      this.properties.push(this.fb.control(propertyName));
      this.displayedColumns.push(propertyName);
      (this.deckForm as FormGroup).addControl(propertyName, this.fb.control(''));
    }
  }

  setPropertyType(propertyName: string, type: PropertyType): void {
    this.propertyTypes[propertyName] = type;
  }

  addCard(): void {
    if (this.deckForm.invalid) {
      return;
    }

    const cardData: any = {};

    this.properties.controls.forEach((propertyControl) => {
      const propertyName = propertyControl.value;
      cardData[propertyName] = this.deckForm.get(propertyName)?.value || '';
    });

    this.cards.push(cardData);
    this.cards = [...this.cards];
    this.resetCardForm();
  }

  resetCardForm(): void {
    this.properties.controls.forEach((propertyControl) => {
      const propertyName = propertyControl.value;
      this.deckForm.get(propertyName)?.reset('');
    });
  }

  onCardSubmit(): void {
    this.submissionService.sendUserGeneratedDeck({
      deckName: this.deckForm.get('deckName')?.value,
      username: this.username,
      properties: this.propertyTypes,
      cards: this.cards
    });
  }

  nextStep(step: number): void {
    this.currentStep = step;
  }
}

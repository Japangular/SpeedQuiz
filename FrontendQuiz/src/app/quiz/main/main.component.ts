import { Component } from '@angular/core';
import {MainService} from './main.service';
import {AsyncPipe} from '@angular/common';
import {CardViewComponent} from '../libquiz/card-view/card-view.component';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    AsyncPipe,
    CardViewComponent,
    FormsModule
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {
  inputValue: string = '';

  constructor(protected ms: MainService) { }

  nextCard(withoutHelp?: boolean){
    if(withoutHelp === false){
      this.ms.useHint();
    }
    this.ms.nextCard();
  }
  useHint(){
    this.ms.useHint();
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.processInput();
    }
  }

  processInput() {
    const trimmedInput = this.inputValue.trim();
    if (!trimmedInput) return;



    this.inputValue = ''; // Clear the input after emitting
  }
}

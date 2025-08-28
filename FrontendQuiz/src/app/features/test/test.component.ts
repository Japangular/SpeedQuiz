import { Component } from '@angular/core';
import {InputDisplayComponent} from '../quiz/widget/input-display/input-display.component';

@Component({
  selector: 'app-test',
  imports: [
    InputDisplayComponent
  ],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent {

}

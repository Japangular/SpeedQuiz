import {Component} from '@angular/core';
import {InputDisplayComponent} from '../../widgets/input-display/input-display.component';

@Component({
  selector: 'app-test',
  imports: [
    InputDisplayComponent,
    InputDisplayComponent
  ],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent {

}

import { Component } from '@angular/core';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-access-gate',
  imports: [
    MatCard,
    MatCardTitle,
    MatIcon,
    MatCardContent
  ],
  templateUrl: './access-gate.component.html',
  styleUrl: './access-gate.component.css'
})
export class AccessGateComponent {

}

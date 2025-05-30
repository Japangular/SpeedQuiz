import { Component } from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {RouterLink} from '@angular/router';
import {MatAnchor} from '@angular/material/button';

@Component({
  selector: 'app-footer',
  imports: [
    MatToolbar,
    RouterLink,
    MatAnchor
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

}

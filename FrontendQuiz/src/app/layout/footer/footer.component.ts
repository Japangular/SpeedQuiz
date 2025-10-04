import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatAnchor} from '@angular/material/button';

@Component({
  selector: 'app-footer',
  imports: [
    RouterLink,
    MatAnchor
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

}

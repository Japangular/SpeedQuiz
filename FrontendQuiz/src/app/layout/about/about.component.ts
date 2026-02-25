import {Component, inject} from '@angular/core';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {SiteModeService} from '../../site-mode/site-mode.service';

@Component({
  selector: 'app-about',
  imports: [
    MatCard,
    MatCardTitle,
    MatCardContent,
    MatIcon
  ],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {
  siteModeService = inject(SiteModeService);
}

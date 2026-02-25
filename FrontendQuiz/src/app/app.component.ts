import {Component, inject, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {LocalProfileService} from './user-store-management/local-profile.service';
import {SiteModeService} from './site-mode/site-mode.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'FrontendQuiz';
  private profileService = inject(LocalProfileService);
  private siteModeService = inject(SiteModeService);

  ngOnInit() {
    this.profileService.initialize().subscribe();
    this.siteModeService.initialize();
  }
}

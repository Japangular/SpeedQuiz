import {Component, inject, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {LocalProfileService} from './user-store-management/local-profile.service';

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

  ngOnInit() {
    this.profileService.initialize().subscribe();
  }
}

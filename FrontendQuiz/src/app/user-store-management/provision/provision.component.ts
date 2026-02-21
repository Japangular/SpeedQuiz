import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {LocalProfileService} from '../local-profile.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-provision',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressBarModule,
  ],
  templateUrl: './provision.component.html',
  styleUrl: './provision.component.css'
})
export class ProvisionComponent {
  private profileService = inject(LocalProfileService);
  private snackBar = inject(MatSnackBar);

  mode: 'new' | 'restore' = 'new';
  displayName = '';
  importJson = '';
  loading = false;
  error = '';

  startLearning(): void {
    const name = this.displayName.trim();
    if (!name) return;

    this.loading = true;
    this.error = '';

    this.profileService.provision(name).subscribe(profile => {
      this.loading = false;
      if (profile) {
        this.snackBar.open(`Welcome, ${profile.displayName}!`, 'OK', {duration: 3000});
        // The parent component (AppComponent or SideNav) watches profile$
        // and will swap in the real UI automatically.
      } else {
        this.error = 'Name might already be taken, or the server is unavailable. Try a different name.';
      }
    });
  }

  restoreProfile(): void {
    const json = this.importJson.trim();
    if (!json) return;

    this.loading = true;
    this.error = '';

    this.profileService.importProfile(json).subscribe(success => {
      this.loading = false;
      if (success) {
        this.snackBar.open('Profile restored!', 'OK', {duration: 3000});
      } else {
        this.error = 'Invalid save file, or the session has expired. You can start fresh instead.';
      }
    });
  }
}

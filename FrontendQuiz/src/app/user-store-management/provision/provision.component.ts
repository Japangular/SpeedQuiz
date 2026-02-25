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
    this.doProvision(name);
  }

  /**
   * Skips the name input — generates something like "Learner-a7x3"
   */
  skipWithRandomName(): void {
    const suffix = Math.random().toString(36).substring(2, 6);
    this.doProvision(`Learner-${suffix}`);
  }

  private doProvision(name: string): void {
    this.loading = true;
    this.error = '';

    this.profileService.provision(name).subscribe(profile => {
      this.loading = false;
      if (profile) {
        this.snackBar.open(`Welcome, ${profile.displayName}!`, 'OK', {duration: 3000});
      } else {
        this.error = 'Could not create session. The server may be unavailable.';
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

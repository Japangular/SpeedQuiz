import {Component, inject} from '@angular/core';
import {AsyncPipe, NgIf} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatDividerModule} from '@angular/material/divider';
import {LocalProfileService} from '../local-profile.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile-actions',
  standalone: true,
  imports: [
    NgIf,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    AsyncPipe,
  ],
  templateUrl: './profile-actions.component.html',
  styleUrl: './profile-actions.component.css'
})
export class ProfileActionsComponent {
  profileService = inject(LocalProfileService);
  private snackBar = inject(MatSnackBar);

  localSave() {
    const json = this.profileService.exportProfile();

    const blob = new Blob([json], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `japangular-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.snackBar.open(
      'Save file downloaded. Keep it private — it grants access to your data.',
      'OK',
      {duration: 5000}
    );
  }

  clearSession(): void {
    // Could add a confirmation dialog here, but for now just clear
    this.profileService.clearProfile();
    this.snackBar.open('Session cleared. Refresh to start over.', 'OK', {duration: 3000});
  }
}

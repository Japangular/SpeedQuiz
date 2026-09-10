import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, map, Observable, switchMap, throwError, of} from 'rxjs';


import {LocalProfile, LocalProfileService} from './local-profile.service';
import {SessionSyncService} from '../features/quiz/utils/quiz-session/session-sync.service';
import {environment} from '../environments/environment';

export interface LinkCode {
  /** Display form, e.g. "K7P-M42". */
  code: string;
  /** Epoch millis. */
  expiresAt: number;
  expiresInSeconds: number;
}

/**
 * Moves a session to another device via a short-lived code.
 *
 * Replaces the export-a-file-and-open-it-on-your-phone dance: generate on the
 * device that has the profile, type it on the one that does not.
 */
@Injectable({providedIn: 'root'})
export class DeviceLinkService {
  private http = inject(HttpClient);
  private profile = inject(LocalProfileService);
  private sessionSync = inject(SessionSyncService);

  private apiUrl = `${environment.apiBaseUrl}/session/link`;

  /**
   * Issues a code for the current session. Any code issued earlier stops
   * working, so a code left on screen and forgotten cannot be used later.
   */
  start(): Observable<LinkCode> {
    return this.http.post<LinkCode>(`${this.apiUrl}/start`, {}).pipe(
      catchError((err: HttpErrorResponse) => throwError(() =>
        new Error(err.status === 401
          ? 'This device has no session yet, so there is nothing to share.'
          : 'Could not create a code. Check the connection and try again.'))),
    );
  }

  /**
   * Adopts the session the code points at, replacing whatever identity this
   * device had. Cached decks and progress from the old identity are dropped,
   * because they belong to a different owner and would otherwise linger as
   * stale blobs keyed on ids this session cannot read.
   */
  claim(code: string): Observable<LocalProfile> {
    return this.http.post<{token: string; displayName: string}>(
      `${this.apiUrl}/claim`, {code: code.trim()},
    ).pipe(
      switchMap(response => {
        this.sessionSync.stopSync();
        this.sessionSync.clearAllLocal();
        localStorage.removeItem('japangular_last_deck');
        return this.profile.adopt(response.token, response.displayName);
      }),
      catchError((err: HttpErrorResponse) => {
        if (err instanceof Error) return throwError(() => err);
        if (err.status === 429) {
          return throwError(() => new Error('Too many attempts. Wait a minute and try again.'));
        }
        if (err.status === 400) {
          return throwError(() => new Error('That code is the wrong length. It should be six characters.'));
        }
        return throwError(() => new Error(
          'That code is not valid. Generate a new one on the other device.'));
      }),
    );
  }
}

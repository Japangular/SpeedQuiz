import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, catchError, Observable, of} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {environment} from '../environments/environment';

export interface LocalProfile {
  token: string;
  displayName: string;
  wkTokenHash?: string;
  wkProvider?: string;
  wkClaimedName?: string;
  exportedAt?: string;
}

interface ProvisionResponse {
  token: string;
  displayName: string;
}

const PROFILE_STORAGE_KEY = 'japangular_profile';

@Injectable({
  providedIn: 'root'
})
export class LocalProfileService {
  private apiUrl = `${environment.apiBaseUrl}/session`;
  private profileSubject = new BehaviorSubject<LocalProfile | null>(null);
  profile$ = this.profileSubject.asObservable();

  /** Starts false — becomes true once initialize() has finished (success or failure). */
  private initializedSubject = new BehaviorSubject<boolean>(false);
  initialized$ = this.initializedSubject.asObservable();

  constructor(private http: HttpClient) { }

  initialize(): Observable<boolean> {
    const stored = this.loadFromStorage();

    if (stored?.token){
      return this.validate(stored.token).pipe(
        tap(valid => {
          if (valid) {
            this.profileSubject.next(stored);
          }
          this.initializedSubject.next(true);
        })
      );
    }

    // No stored token — mark as initialized immediately
    this.initializedSubject.next(true);
    return of(false);
  }

  provision(displayName: string): Observable<LocalProfile | null> {
    return this.http.post<ProvisionResponse>(`${this.apiUrl}/provision`, {displayName}).pipe(
      map(response => {
        const profile: LocalProfile = {
          token: response.token,
          displayName: response.displayName
        };
        this.saveToStorage(profile);
        this.profileSubject.next(profile);
        return profile;
      }),
      catchError(error => {
        console.error('Error while initializing provision', error);
        return of(null);
      })
    )
  }

  getToken(): string | null {
    return this.profileSubject.value?.token ?? null;
  }

  getDisplayName(): string | null  {
    return this.profileSubject.value?.displayName ?? null;
  }

  isProvisioned(): boolean {
    return this.profileSubject.value?.token != null;
  }

  updateProfile(patch: Partial<LocalProfile>): void{
    const current = this.profileSubject.value;
    if(!current) return;

    const updated = {...current, ...patch};
    this.saveToStorage(updated);
    this.profileSubject.next(updated);
  }

  exportProfile(): string {
    const profile = this.profileSubject.value;
    if(!profile) return '{}';

    return JSON.stringify({...profile, exportedAt: new Date().toISOString()}, null, 2);
  }

  importProfile(json: string): Observable<boolean>{
    try {
      const imported = JSON.parse(json) as LocalProfile;

      if (!imported) return of(false);

      return this.validate(imported.token).pipe(
        tap(valid => {
          if (valid) {
            this.saveToStorage(imported);
            this.profileSubject.next(imported);
          }
        })
      );
    } catch {return of(false)}
  }

  clearProfile(): void {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    this.profileSubject.next(null);
  }

  private validate(token: string): Observable<boolean> {
    return this.http
      .get<ProvisionResponse>(`${this.apiUrl}/validate`, {
        headers: {'X-Session-Token': token}
      })
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  private saveToStorage(profile: LocalProfile): void {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }

  private loadFromStorage(): LocalProfile | null {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LocalProfile;
    } catch {
      return null;
    }
  }
}
